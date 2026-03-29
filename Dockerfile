# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files first for better layer caching
COPY MemoPal.sln ./
COPY src/MemoPal.Api/MemoPal.Api.csproj src/MemoPal.Api/
COPY src/MemoPal.Application/MemoPal.Application.csproj src/MemoPal.Application/
COPY src/MemoPal.Domain/MemoPal.Domain.csproj src/MemoPal.Domain/
COPY src/MemoPal.Infrastructure/MemoPal.Infrastructure.csproj src/MemoPal.Infrastructure/

RUN dotnet restore MemoPal.sln

# Copy everything else and publish
COPY . .
RUN dotnet publish src/MemoPal.Api/MemoPal.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
# Default path designed for external Docker volume mounting
ENV FileStorage__RootPath=/data/uploads

COPY --from=build /app/publish .
RUN mkdir -p /data/uploads

VOLUME ["/data/uploads"]
EXPOSE 8080

ENTRYPOINT ["dotnet", "MemoPal.Api.dll"]