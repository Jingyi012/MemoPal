using Mapster;
using MediatR;
using MemoPal.Application.Common.Mapping;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace MemoPal.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var config = TypeAdapterConfig.GlobalSettings;
        MapsterRegistration.Register(config);

        services.AddMediatR(Assembly.GetExecutingAssembly());
        return services;
    }
}
