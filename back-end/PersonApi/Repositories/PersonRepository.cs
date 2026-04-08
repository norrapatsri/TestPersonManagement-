using PersonApi.Data;
using PersonApi.Models;

namespace PersonApi.Repositories;

public class PersonRepository(AppDbContext db) : IPersonRepository
{
    public List<PersonEntity> GetAll() =>
        db.Persons
            .OrderBy(p => p.Id)
            .ToList();

    public PersonEntity? GetById(int id) => db.Persons.Find(id);

    public PersonEntity Add(PersonEntity entity)
    {
        db.Persons.Add(entity);
        db.SaveChanges();
        return entity;
    }
}
