using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record RegisterCommand(string DisplayName, string Email, string Password) : IRequest<AuthResponseDto>;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public RegisterCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationAppException("displayName, email, and password are required.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            throw new ConflictAppException("Email already exists.");
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid().ToString("D"),
            DisplayName = request.DisplayName.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRoles.User,
            CreatedAt = now,
            UpdatedAt = now
        };

        var stats = new UserStats
        {
            UserId = user.Id,
            LastActiveDate = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _db.Users.AddAsync(user, cancellationToken);
        await _db.UserStats.AddAsync(stats, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var token = _tokenGenerator.GenerateToken(user.Id, user.Email, user.Role);
        return new AuthResponseDto(token, (user, stats).Adapt<UserWithStatDto>());
    }
}
