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
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        MapsterRegistration.BaseUrl = configuration["MediaUrl:BaseUrl"] ?? string.Empty;
        MapsterRegistration.PublicBasePath = configuration["FileStorage:PublicBasePath"] ?? "/files";

        var config = TypeAdapterConfig.GlobalSettings;
        config.Scan(Assembly.GetExecutingAssembly());

        services.AddMediatR(Assembly.GetExecutingAssembly());
        services.AddScoped<EducationAccess>();
        return services;
    }
}
