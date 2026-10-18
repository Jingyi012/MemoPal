using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace MemoPal.IntegrationTests.Fixtures;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public CustomWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("UseInMemoryDatabase", "true");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "MemoPal");
        Environment.SetEnvironmentVariable("Jwt__Audience", "MemoPal.Mobile");
        Environment.SetEnvironmentVariable("Jwt__Secret", "TEST_SECRET_12345678901234567890");
        Environment.SetEnvironmentVariable("Jwt__ExpiryMinutes", "60");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:InMemoryName"] = $"MemoPalIntegrationTests-{Guid.NewGuid():N}"
            }));
    }
}
