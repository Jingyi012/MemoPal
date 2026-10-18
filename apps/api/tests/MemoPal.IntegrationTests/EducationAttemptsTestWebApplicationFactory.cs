using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MemoPal.IntegrationTests;

public sealed class EducationAttemptsTestWebApplicationFactory : Fixtures.CustomWebApplicationFactory, IAsyncLifetime
{
    private readonly string _fileRoot = Path.Combine(Path.GetTempPath(), $"memopal-education-tests-{Guid.NewGuid():N}");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["FileStorage:RootPath"] = Path.Combine(_fileRoot, "public"),
            ["FileStorage:PrivateRootPath"] = Path.Combine(_fileRoot, "private")
        }));
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.AddScoped<AppDbContext>(sp => new EducationAttemptsTestDbContext(
                sp.GetRequiredService<DbContextOptions<AppDbContext>>()));
            services.RemoveAll<IAppDbContext>();
            services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        });
    }

    public Task InitializeAsync() => Task.CompletedTask;

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        if (Directory.Exists(_fileRoot)) Directory.Delete(_fileRoot, recursive: true);
    }

    private sealed class EducationAttemptsTestDbContext(DbContextOptions<AppDbContext> options)
        : AppDbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            var attempts = new EducationAttemptConfiguration();
            modelBuilder.ApplyConfiguration<EducationAssessmentAttempt>(attempts);
            modelBuilder.ApplyConfiguration<EducationAssessmentResponse>(attempts);
        }
    }
}
