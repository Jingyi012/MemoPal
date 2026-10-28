using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace MemoPal.IntegrationTests.Fixtures;

public sealed class StarterCatalogWebApplicationFactory : CustomWebApplicationFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EducationStarterCatalog:Enabled"] = "true"
            }));
    }
}
