using System.Reflection;
using MemoPal.Api.Controllers;
using MemoPal.Api.Security;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace MemoPal.UnitTests;

public sealed class RestrictedLearnerPolicyTests
{
    [Fact]
    public void Existing_and_new_accounts_default_to_standard() =>
        Assert.Equal(AccountMode.Standard, new User().AccountMode);

    [Theory]
    [InlineData(true, null, false)]
    [InlineData(true, RestrictedLearnerAccess.Deny, false)]
    [InlineData(true, RestrictedLearnerAccess.Allow, true)]
    [InlineData(true, RestrictedLearnerAccess.Conditional, true)]
    [InlineData(false, null, true)]
    [InlineData(false, RestrictedLearnerAccess.Deny, true)]
    public void Restricted_policy_is_explicit_allow_and_standard_policy_is_unchanged(
        bool restricted, RestrictedLearnerAccess? classification, bool allowed) =>
        Assert.Equal(allowed, RestrictedLearnerFilter.Permits(restricted, classification));

    [Fact]
    public void Every_controller_action_has_an_explicit_restricted_learner_classification()
    {
        var actions = typeof(AuthController).Assembly.GetTypes()
            .Where(type => !type.IsAbstract && typeof(ControllerBase).IsAssignableFrom(type))
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            .Where(method => !method.IsSpecialName && method.GetCustomAttribute<NonActionAttribute>() is null).ToArray();
        Assert.NotEmpty(actions);
        var missing = actions.Where(method => method.GetCustomAttributes(false)
            .Count(attribute => attribute.GetType().Name == "RestrictedLearnerAttribute") != 1)
            .Select(method => method.DeclaringType!.Name + "." + method.Name).ToArray();
        Assert.True(missing.Length == 0, "Unclassified actions: " + string.Join(", ", missing));
        Assert.All(actions, action => Assert.True(Enum.IsDefined(action.GetCustomAttribute<RestrictedLearnerAttribute>()!.Access)));
    }
}
