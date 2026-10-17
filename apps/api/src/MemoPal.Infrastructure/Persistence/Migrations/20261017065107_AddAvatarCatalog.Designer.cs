using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MemoPal.Infrastructure.Persistence;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261017065107_AddAvatarCatalog")]
public partial class AddAvatarCatalog
{
}
