using Mapster;
using MemoPal.Application;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.UnitTests;

public sealed class ApplicationMappingInitializationTests
{
    [Fact]
    public void Concurrent_host_initialization_and_first_adapt_use_compiled_process_mapping()
    {
        Parallel.For(0, 24, index =>
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["MediaUrl:BaseUrl"] = $"https://media-{index}.example.test",
                    ["FileStorage:PublicBasePath"] = "/files",
                })
                .Build();
            new ServiceCollection().AddApplication(configuration);

            var user = new User
            {
                Id = $"user-{index}",
                DisplayName = "Learner",
                Email = $"learner-{index}@example.test",
                AccountMode = AccountMode.RestrictedLearner,
                AvatarUrl = "media:avatar",
            };
            var stats = new UserStats { UserId = user.Id, LessonsCompleted = 4, WordsLearned = 12 };
            var dto = (user, stats).Adapt<UserWithStatDto>();

            Assert.Equal(user.Id, dto.Id);
            Assert.Equal("RestrictedLearner", dto.AccountMode);
            Assert.NotNull(dto.Stats);
            Assert.Equal(4, dto.Stats.LessonsCompleted);
            Assert.Equal(12, dto.Stats.WordsLearned);
        });
    }
}
