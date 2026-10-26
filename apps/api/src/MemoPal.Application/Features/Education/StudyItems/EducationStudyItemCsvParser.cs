using System.Globalization;
using System.Text;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.Application.Features.Education.StudyItems;

internal sealed record EducationStudyItemCsvParseResult(IReadOnlyList<EducationObjectiveStudyItemRequest> Items,
    IReadOnlyList<int> SourceRows, IReadOnlyList<EducationStudyItemImportError> Errors);

internal static class EducationStudyItemCsvParser
{
    private static readonly string[] RequiredHeaders = ["kind", "primary", "secondary", "phonetic", "extra", "hint", "position", "language"];
    private static readonly string[] AllowedHeaders = ["key", "kind", "primary", "secondary", "phonetic", "extra", "hint", "position", "language"];

    public static EducationStudyItemCsvParseResult Parse(byte[] content)
    {
        string csv;
        try { csv = new UTF8Encoding(false, true).GetString(content); }
        catch (DecoderFallbackException)
        {
            return new([], [], [new(1, "file", "CSV 必须为 UTF-8 编码，请另存为 UTF-8。 (CSV must be UTF-8; please save the file as UTF-8.)")]);
        }
        if (csv.Length > 0 && csv[0] == '\uFEFF') csv = csv[1..];
        var records = ParseRecords(csv);
        if (records.Errors.Count > 0) return new([], [], records.Errors);
        if (records.Rows.Count == 0) return new([], [], [new(1, "header", "CSV header row is required.")]);

        var header = records.Rows[0].Fields.Select(x => x.Trim().ToLowerInvariant()).ToArray();
        var errors = new List<EducationStudyItemImportError>();
        if (header.Distinct(StringComparer.Ordinal).Count() != header.Length)
            errors.Add(new(records.Rows[0].Line, "header", "CSV headers must be unique."));
        foreach (var name in RequiredHeaders)
            if (!header.Contains(name, StringComparer.Ordinal)) errors.Add(new(records.Rows[0].Line, name, $"Required CSV column '{name}' is missing."));
        foreach (var name in header.Where(x => !AllowedHeaders.Contains(x, StringComparer.Ordinal)))
            errors.Add(new(records.Rows[0].Line, "header", $"Unknown CSV column '{name}'."));
        if (errors.Count > 0) return new([], [], errors);

        var indexes = RequiredHeaders.ToDictionary(name => name, name => Array.IndexOf(header, name), StringComparer.Ordinal);
        var keyIndex = Array.IndexOf(header, "key");
        var items = new List<EducationObjectiveStudyItemRequest>();
        var sourceRows = new List<int>();
        foreach (var record in records.Rows.Skip(1))
        {
            if (record.Fields.All(string.IsNullOrWhiteSpace)) continue;
            if (record.Fields.Count != header.Length)
            {
                errors.Add(new(record.Line, "row", $"Expected {header.Length} columns but found {record.Fields.Count}."));
                continue;
            }
            string Value(string column) => record.Fields[indexes[column]];
            string? Key() => keyIndex < 0 ? null : EmptyToNull(record.Fields[keyIndex]);
            if (!int.TryParse(Value("position"), NumberStyles.None, CultureInfo.InvariantCulture, out var position))
            {
                errors.Add(new(record.Line, "position", "Position must be a positive integer."));
                continue;
            }
            items.Add(new EducationObjectiveStudyItemRequest(Key(), position, Value("kind"),
                Value("primary"), EmptyToNull(Value("secondary")), EmptyToNull(Value("phonetic")),
                EmptyToNull(Value("extra")), EmptyToNull(Value("hint")), null, EmptyToNull(Value("language"))));
            sourceRows.Add(record.Line);
        }
        if (items.Count > EducationStudyItemImportPlanner.MaxRows)
            errors.Add(new(records.Rows.Last().Line, "items", "TooManyRows", "An import can contain at most 1000 rows."));
        return new(items, sourceRows, errors);
    }

    private static string? EmptyToNull(string value) => string.IsNullOrWhiteSpace(value) ? null : value;

    private sealed record CsvRecord(int Line, List<string> Fields);
    private sealed record CsvParseResult(List<CsvRecord> Rows, List<EducationStudyItemImportError> Errors);

    private static CsvParseResult ParseRecords(string input)
    {
        var rows = new List<CsvRecord>();
        var errors = new List<EducationStudyItemImportError>();
        var fields = new List<string>();
        var field = new StringBuilder();
        var quoted = false;
        var closedQuote = false;
        var line = 1;
        var recordLine = 1;
        for (var i = 0; i < input.Length; i++)
        {
            var ch = input[i];
            if (quoted)
            {
                if (ch == '"')
                {
                    if (i + 1 < input.Length && input[i + 1] == '"') { field.Append('"'); i++; }
                    else { quoted = false; closedQuote = true; }
                }
                else if (ch == '\r' || ch == '\n')
                {
                    if (ch == '\r' && i + 1 < input.Length && input[i + 1] == '\n') i++;
                    field.Append('\n');
                    line++;
                }
                else field.Append(ch);
                continue;
            }

            if (closedQuote && ch != ',' && ch != '\r' && ch != '\n' && ch != ' ')
            {
                errors.Add(new(recordLine, "csv", "Unexpected character after a quoted field."));
                return new(rows, errors);
            }
            if (ch == '"')
            {
                if (field.Length != 0) { errors.Add(new(line, "csv", "Quote must begin at the start of a field.")); return new(rows, errors); }
                quoted = true;
                continue;
            }
            if (ch == ',')
            {
                fields.Add(field.ToString().Trim()); field.Clear(); closedQuote = false;
                continue;
            }
            if (ch == '\r' || ch == '\n')
            {
                fields.Add(field.ToString().Trim()); field.Clear();
                rows.Add(new(recordLine, fields)); fields = [];
                if (ch == '\r' && i + 1 < input.Length && input[i + 1] == '\n') i++;
                line++; recordLine = line; closedQuote = false;
                continue;
            }
            if (!closedQuote) field.Append(ch);
        }
        if (quoted) errors.Add(new(recordLine, "csv", "Quoted field is not closed."));
        else if (fields.Count > 0 || field.Length > 0)
        {
            fields.Add(field.ToString().Trim());
            rows.Add(new(recordLine, fields));
        }
        return new(rows, errors);
    }
}
