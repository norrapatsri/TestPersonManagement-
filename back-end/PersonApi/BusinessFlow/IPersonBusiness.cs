using PersonApi.Models;

namespace PersonApi.BusinessFlow;

public interface IPersonBusiness
{
    List<PersonResponse> GetAll();
    PersonResponse? GetById(int id);
    PersonResponse Create(CreatePersonRequest request);
}
