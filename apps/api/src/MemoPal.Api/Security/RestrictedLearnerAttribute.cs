namespace MemoPal.Api.Security;

public enum RestrictedLearnerAccess { Deny, Allow, Conditional }

/// <summary>Action-local classification. Unannotated actions fail closed for restricted accounts.</summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
public sealed class RestrictedLearnerAttribute(RestrictedLearnerAccess access) : Attribute
{
    public RestrictedLearnerAccess Access { get; } = access;
}
