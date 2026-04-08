using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PersonApi.Models;

[Table("persons")]
public class PersonEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    [Column("house_number")]
    public string HouseNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    [Column("street")]
    public string? Street { get; set; }

    [Required, MaxLength(100)]
    [Column("sub_district")]
    public string SubDistrict { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    [Column("district")]
    public string District { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    [Column("province")]
    public string Province { get; set; } = string.Empty;

    [Required]
    [Column("postal_code", TypeName = "CHAR(5)")]
    public string PostalCode { get; set; } = string.Empty;

    [Column("birth_date")]
    public DateOnly BirthDate { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
