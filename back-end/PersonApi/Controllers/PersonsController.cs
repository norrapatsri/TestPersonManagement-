using Microsoft.AspNetCore.Mvc;
using PersonApi.BusinessFlow;
using PersonApi.Exceptions;
using PersonApi.Models;

namespace PersonApi.Controllers;

[ApiController]
public class PersonsController(IPersonBusiness business) : ControllerBase
{
    [HttpGet("api/persons")]
    public List<PersonResponse> GetAll()
    {
        return business.GetAll();
    }

    [HttpGet("api/persons/{id}")]
    public PersonResponse GetById(int id)
    {
        return  business.GetById(id);
    }

    [HttpPost("api/persons")]
    public PersonResponse Create([FromBody] CreatePersonRequest request)
    {
        return business.Create(request);
    }
}
