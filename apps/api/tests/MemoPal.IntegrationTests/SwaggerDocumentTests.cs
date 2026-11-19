using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using MemoPal.IntegrationTests.Fixtures;

namespace MemoPal.IntegrationTests;

public sealed class SwaggerDocumentTests(SwaggerDocumentTests.SwaggerFactory factory) : IClassFixture<SwaggerDocumentTests.SwaggerFactory>
{
    [Fact]
    public async Task Swagger_describes_attempt_attachment_as_multipart_form_data()
    {
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var operation = document.RootElement.GetProperty("paths")
            .GetProperty("/v1/education/attempts/{attemptId}/responses/{questionId}/photo")
            .GetProperty("post");
        Assert.Equal("multipart/form-data", operation.GetProperty("requestBody").GetProperty("content").EnumerateObject().Single().Name);
        var requestSchema = operation.GetProperty("requestBody").GetProperty("content").GetProperty("multipart/form-data").GetProperty("schema");
        var schema = requestSchema.TryGetProperty("$ref", out var reference)
            ? document.RootElement.GetProperty("components").GetProperty("schemas").GetProperty(reference.GetString()!.Split('/').Last())
            : requestSchema;
        var properties = schema.GetProperty("properties");
        Assert.Contains(properties.EnumerateObject(), x => x.Name.Equals("file", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(properties.EnumerateObject(), x => x.Name.Equals("expectedVersion", StringComparison.OrdinalIgnoreCase));
    }

    public sealed class SwaggerFactory : CustomWebApplicationFactory
    {
        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseEnvironment("Development");
        }
    }
}
