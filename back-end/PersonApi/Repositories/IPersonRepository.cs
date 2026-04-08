using PersonApi.Models;

namespace PersonApi.Repositories;

public interface IPersonRepository
{
    List<PersonEntity> GetAll();
    PersonEntity? GetById(int id);
    PersonEntity Add(PersonEntity entity);
}
