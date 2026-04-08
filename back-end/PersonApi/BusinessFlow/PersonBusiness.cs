using PersonApi.Models;
using PersonApi.Repositories;

namespace PersonApi.BusinessFlow;

public class PersonBusiness(IPersonRepository repo) : IPersonBusiness
{
    public List<PersonResponse> GetAll()
    {
        return repo.GetAll().Select(MapToResponse).ToList();
    }

    public PersonResponse? GetById(int id)
    {
        PersonEntity? entity = repo.GetById(id);
        if (entity is null)
            throw new NotFoundException($"Person with id {id} not found");
            
        return MapToResponse(entity);
    }

    public PersonResponse Create(CreatePersonRequest request)
    {
        PersonEntity entity = new PersonEntity
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            HouseNumber = request.HouseNumber,
            Street = request.Street,
            SubDistrict = request.SubDistrict,
            District = request.District,
            Province = request.Province,
            PostalCode = request.PostalCode,
            BirthDate = request.BirthDate,
            CreatedAt = DateTime.UtcNow
        };

        repo.Add(entity);
        return MapToResponse(entity);
    }

    private static PersonResponse MapToResponse(PersonEntity p) => new()
    {
        Id = p.Id,
        FirstName = p.FirstName,
        LastName = p.LastName,
        HouseNumber = p.HouseNumber,
        Street = p.Street,
        SubDistrict = p.SubDistrict,
        District = p.District,
        Province = p.Province,
        PostalCode = p.PostalCode,
        BirthDate = p.BirthDate,
        CreatedAt = p.CreatedAt
    };
}
