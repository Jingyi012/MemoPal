using Mapster;
using MediatR;
using MemoPal.Application.Common.Mapping;
using MemoPal.Application.Features.Education.Relationships;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace MemoPal.Application;

public static class DependencyInjection
{
    private static readonly object MapsterInitializationLock = new();
    private static bool _mapsterInitialized;

    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        lock (MapsterInitializationLock)
        {
            if (!_mapsterInitialized)
            {
                // Mapster's GlobalSettings is process-wide. The first host configures its media URL values;
                // subsequent hosts share the compiled mapping and cannot provide different media bases.
                MapsterRegistration.BaseUrl = configuration["MediaUrl:BaseUrl"] ?? string.Empty;
                MapsterRegistration.PublicBasePath = configuration["FileStorage:PublicBasePath"] ?? "/files";

                var config = TypeAdapterConfig.GlobalSettings;
                config.Scan(Assembly.GetExecutingAssembly());
                config.Compile();
                _mapsterInitialized = true;
            }
        }

        services.AddMediatR(Assembly.GetExecutingAssembly());
        services.AddScoped<EducationAccess>();
        return services;
    }
}
