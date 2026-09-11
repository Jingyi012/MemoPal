using MemoPal.Application.Common.Settings;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.Auth;
using MemoPal.Infrastructure.AI;
using MemoPal.Infrastructure.Persistence;
using MemoPal.Infrastructure.Security;
using MemoPal.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace MemoPal.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemoryDatabase = configuration.GetValue<bool>("UseInMemoryDatabase");

        services.AddDbContext<AppDbContext>(options =>
        {
            if (useInMemoryDatabase)
            {
                options.UseInMemoryDatabase("MemoPalDb");
            }
            else
            {
                options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    npgsql =>
                    {
                        npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                        npgsql.EnableRetryOnFailure();
                    });
            }
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddOptions<AiCreditOptions>()
            .Validate(x => x.TextCost is > 0 and <= 10000 && x.ImageCost is > 0 and <= 10000, "AI credit costs must be between 1 and 10000.")
            .ValidateOnStart();
        services.AddScoped<AiCreditService>();
        services.AddScoped<DatabaseAiSettings>();
        services.AddScoped<IOptions<AiCreditOptions>>(sp => sp.GetRequiredService<DatabaseAiSettings>().Read(AiSettings.Credits, sp.GetRequiredService<IOptionsFactory<AiCreditOptions>>()));
        services.AddScoped<IOptions<AiImageGenerationOptions>>(sp => sp.GetRequiredService<DatabaseAiSettings>().Read(AiSettings.Images, sp.GetRequiredService<IOptionsFactory<AiImageGenerationOptions>>()));
        services.AddScoped<IOptions<PalaceAssociationGenerationOptions>>(sp => sp.GetRequiredService<DatabaseAiSettings>().Read(AiSettings.Text, sp.GetRequiredService<IOptionsFactory<PalaceAssociationGenerationOptions>>()));
        services.AddScoped<IAiCredits>(sp => sp.GetRequiredService<AiCreditService>());
        services.AddHttpClient<NumberPegImageGenerator>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(3);
            client.MaxResponseContentBufferSize = 10_000_000;
        }).RemoveAllLoggers();
        services.AddHostedService<AiImageWorker>();

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var socialAuthOptions = configuration.GetSection(SocialAuthOptions.SectionName).Get<SocialAuthOptions>() ?? new SocialAuthOptions();
        services.AddSingleton(Options.Create(jwtOptions));
        services.AddSingleton(Options.Create(socialAuthOptions));

        var fileStorageOptions = configuration.GetSection(FileStorageOptions.SectionName).Get<FileStorageOptions>() ?? new FileStorageOptions();
        services.AddSingleton(Options.Create(fileStorageOptions));

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddHttpClient<IFacebookTokenValidator, FacebookTokenValidator>();

        // Provider settings are database-backed and scoped per request. The
        // HttpClient factory runs from the root provider, so keep transport
        // timeout configuration independent from scoped AI settings.
        services.AddHttpClient<IPalaceAssociationGenerator, PalaceAssociationGenerator>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(120);
        }).RemoveAllLoggers();
        services.AddHttpClient<INumberPegStoryGenerator, NumberPegStoryGenerator>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(120);
        }).RemoveAllLoggers();

        return services;
    }
}
