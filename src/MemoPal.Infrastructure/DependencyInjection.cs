using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.Auth;
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
                var connectionString = configuration.GetConnectionString("DefaultConnection")
                    ?? "Host=localhost;Port=5432;Database=memopal;Username=postgres;Password=postgres";

                options.UseNpgsql(
                    connectionString,
                    npgsql =>
                    {
                        npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                        npgsql.EnableRetryOnFailure();
                    });
            }
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var socialAuthOptions = configuration.GetSection(SocialAuthOptions.SectionName).Get<SocialAuthOptions>() ?? new SocialAuthOptions();
        services.AddSingleton(Options.Create(jwtOptions));
        services.AddSingleton(Options.Create(socialAuthOptions));

        var fileStorageOptions = configuration.GetSection(FileStorageOptions.SectionName).Get<FileStorageOptions>() ?? new FileStorageOptions();
        services.AddSingleton(Options.Create(fileStorageOptions));

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        services.AddHttpClient<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddHttpClient<IFacebookTokenValidator, FacebookTokenValidator>();

        return services;
    }
}
