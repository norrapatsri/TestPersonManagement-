using Moq;
using PersonApi.BusinessFlow;
using PersonApi.Models;
using PersonApi.Repositories;

namespace PersonApi.Test;

public class PersonBusinessTests
{
    private readonly Mock<IPersonRepository> _repoMock = new();
    private readonly PersonBusiness _sut;

    public PersonBusinessTests()
    {
        _sut = new PersonBusiness(_repoMock.Object);
    }

    private static PersonEntity CreateEntity(int id = 1) => new()
    {
        Id = id,
        FirstName = "สมชาย",
        LastName = "ใจดี",
        HouseNumber = "123",
        Street = "สุขุมวิท",
        SubDistrict = "คลองเตย",
        District = "คลองเตย",
        Province = "กรุงเทพมหานคร",
        PostalCode = "10110",
        BirthDate = new DateOnly(1990, 5, 15),
        CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    };

    private static CreatePersonRequest CreateRequest() => new()
    {
        FirstName = "สมชาย",
        LastName = "ใจดี",
        HouseNumber = "123",
        Street = "สุขุมวิท",
        SubDistrict = "คลองเตย",
        District = "คลองเตย",
        Province = "กรุงเทพมหานคร",
        PostalCode = "10110",
        BirthDate = new DateOnly(1990, 5, 15)
    };

    // --- GetAll ---

    [Fact]
    public void GetAll_ReturnsAllPersons()
    {
        List<PersonEntity> entities = new List<PersonEntity> { CreateEntity(1), CreateEntity(2) };
        _repoMock.Setup(r => r.GetAll()).Returns(entities);

        List<PersonResponse> result = _sut.GetAll();

        Assert.Equal(2, result.Count);
        Assert.Equal("สมชาย", result[0].FirstName);
    }

    [Fact]
    public void GetAll_WhenEmpty_ReturnsEmptyList()
    {
        _repoMock.Setup(r => r.GetAll()).Returns([]);

        List<PersonResponse> result = _sut.GetAll();

        Assert.Empty(result);
    }

    // --- GetById ---

    [Fact]
    public void GetById_WhenFound_ReturnsPersonResponse()
    {
        PersonEntity entity = CreateEntity();
        _repoMock.Setup(r => r.GetById(1)).Returns(entity);

        PersonResponse? result = _sut.GetById(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("สมชาย", result.FirstName);
        Assert.Equal("ใจดี", result.LastName);
        Assert.Equal("123", result.HouseNumber);
        Assert.Equal("สุขุมวิท", result.Street);
        Assert.Equal("คลองเตย", result.SubDistrict);
        Assert.Equal("คลองเตย", result.District);
        Assert.Equal("กรุงเทพมหานคร", result.Province);
        Assert.Equal("10110", result.PostalCode);
        Assert.Equal(new DateOnly(1990, 5, 15), result.BirthDate);
    }

    [Fact]
    public void GetById_WhenNotFound_ReturnsNull()
    {
        _repoMock.Setup(r => r.GetById(999)).Returns((PersonEntity?)null);

        PersonResponse? result = _sut.GetById(999);

        Assert.Null(result);
    }

    // --- Create ---

    [Fact]
    public void Create_CallsRepoAddAndReturnsResponse()
    {
        CreatePersonRequest request = CreateRequest();
        _repoMock.Setup(r => r.Add(It.IsAny<PersonEntity>()))
            .Callback<PersonEntity>(e => e.Id = 10)
            .Returns<PersonEntity>(e => e);

        PersonResponse result = _sut.Create(request);

        Assert.Equal(10, result.Id);
        Assert.Equal("สมชาย", result.FirstName);
        Assert.Equal("ใจดี", result.LastName);
        Assert.Equal("10110", result.PostalCode);
        _repoMock.Verify(r => r.Add(It.IsAny<PersonEntity>()), Times.Once);
    }

    [Fact]
    public void Create_MapsAllFieldsToEntity()
    {
        CreatePersonRequest request = CreateRequest();
        PersonEntity? captured = null;
        _repoMock.Setup(r => r.Add(It.IsAny<PersonEntity>()))
            .Callback<PersonEntity>(e => captured = e)
            .Returns<PersonEntity>(e => e);

        _sut.Create(request);

        Assert.NotNull(captured);
        Assert.Equal(request.FirstName, captured.FirstName);
        Assert.Equal(request.LastName, captured.LastName);
        Assert.Equal(request.HouseNumber, captured.HouseNumber);
        Assert.Equal(request.Street, captured.Street);
        Assert.Equal(request.SubDistrict, captured.SubDistrict);
        Assert.Equal(request.District, captured.District);
        Assert.Equal(request.Province, captured.Province);
        Assert.Equal(request.PostalCode, captured.PostalCode);
        Assert.Equal(request.BirthDate, captured.BirthDate);
    }
}
