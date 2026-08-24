using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class PersistenceModelTests
{
    private static readonly string[] RequiredAuditProperties =
    [
        nameof(AuditableBaseEntity.CreatedAt),
        nameof(AuditableBaseEntity.CreatedBy),
        nameof(AuditableBaseEntity.UpdatedAt),
        nameof(AuditableBaseEntity.UpdatedBy),
        nameof(AuditableBaseEntity.IsDeleted),
        nameof(AuditableBaseEntity.DeletedAt),
        nameof(AuditableBaseEntity.DeletedBy)
    ];

    [Fact]
    public void Every_Concrete_Domain_Entity_Should_Be_Persisted_And_Auditable()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"audit-model-{Guid.NewGuid():N}")
            .Options;

        using var dbContext = new AppDbContext(options);
        var modelEntityTypes = dbContext.Model.GetEntityTypes()
            .Where(entityType => entityType.ClrType.Namespace == typeof(User).Namespace)
            .ToDictionary(entityType => entityType.ClrType);

        var concreteDomainEntities = typeof(User).Assembly.GetTypes()
            .Where(type =>
                type.Namespace == typeof(User).Namespace &&
                type.IsClass &&
                !type.IsAbstract &&
                typeof(BaseEntity).IsAssignableFrom(type))
            .OrderBy(type => type.Name)
            .ToArray();

        Assert.NotEmpty(concreteDomainEntities);

        foreach (var domainEntity in concreteDomainEntities)
        {
            Assert.True(
                typeof(AuditableBaseEntity).IsAssignableFrom(domainEntity),
                $"{domainEntity.Name} must inherit {nameof(AuditableBaseEntity)}.");

            Assert.True(
                modelEntityTypes.TryGetValue(domainEntity, out var modelEntity),
                $"{domainEntity.Name} is a domain entity but is missing from the EF model.");

            foreach (var propertyName in RequiredAuditProperties)
            {
                Assert.NotNull(modelEntity!.FindProperty(propertyName));
            }
        }
    }
}
