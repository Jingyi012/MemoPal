using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using MemoPal.Api.Middleware;
using MemoPal.Api.Options;
using MemoPal.Api.Security;
using MemoPal.Application;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure;
using MemoPal.Infrastructure.Security;
using MemoPal.Infrastructure.Storage;
using Microsoft.Extensions.FileProviders;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var allowedCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray() ?? [];
var allowedCorsOriginSet = new HashSet<string>(allowedCorsOrigins, StringComparer.OrdinalIgnoreCase);

static bool IsPrivateNetworkIp(IPAddress ip)
{
    if (IPAddress.IsLoopback(ip))
    {
        return true;
    }

    if (ip.AddressFamily == AddressFamily.InterNetwork)
    {
        var bytes = ip.GetAddressBytes();
        return bytes[0] == 10 ||
               (bytes[0] == 172 && bytes[1] is >= 16 and <= 31) ||
               (bytes[0] == 192 && bytes[1] == 168);
    }

    if (ip.AddressFamily == AddressFamily.InterNetworkV6)
    {
        return ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal;
    }

    return false;
}

static bool IsDevelopmentOriginAllowed(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    if (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(uri.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(uri.Host, "::1", StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    return IPAddress.TryParse(uri.Host, out var ip) && IsPrivateNetworkIp(ip);
}

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MemoPal Backend API",
        Version = "v1",
        Description = "MemoPal Clean Architecture backend API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using Bearer. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(document =>
    {
        return new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document, null)] = new List<string>()
        };
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();
builder.Services.Configure<BillingWebhookOptions>(builder.Configuration.GetSection(BillingWebhookOptions.SectionName));
builder.Services.Configure<MediaUrlOptions>(builder.Configuration.GetSection(MediaUrlOptions.SectionName));

builder.Services.AddCors(options =>
{
    options.AddPolicy("MemoPalCors", policy =>
    {
        var isDevelopment = builder.Environment.IsDevelopment();

        if (allowedCorsOriginSet.Count > 0 || isDevelopment)
        {
            policy.SetIsOriginAllowed(origin =>
                allowedCorsOriginSet.Contains(origin) ||
                (isDevelopment && IsDevelopmentOriginAllowed(origin)));
        }

        policy.AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var adminBootstrapOptions = builder.Configuration.GetSection(AdminBootstrapOptions.SectionName).Get<AdminBootstrapOptions>() ?? new AdminBootstrapOptions();
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(adminBootstrapOptions));
builder.Services.AddScoped<AdminBootstrapper>();

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var secret = string.IsNullOrWhiteSpace(jwtOptions.Secret)
    ? "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS"
    : jwtOptions.Secret;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MemoPal Backend API v1");
        options.DocumentTitle = "MemoPal Backend API Docs";
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseRouting();
app.UseCors("MemoPalCors");

var fileStorage = builder.Configuration.GetSection(FileStorageOptions.SectionName).Get<FileStorageOptions>() ?? new FileStorageOptions();
var fileRoot = Path.GetFullPath(fileStorage.RootPath);
Directory.CreateDirectory(fileRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(fileRoot),
    RequestPath = fileStorage.PublicBasePath
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (adminBootstrapOptions.Enabled || adminBootstrapOptions.SeedGamificationMockData)
{
    using var scope = app.Services.CreateScope();
    var bootstrapper = scope.ServiceProvider.GetRequiredService<AdminBootstrapper>();
    await bootstrapper.SeedAsync();
}

app.Run();
