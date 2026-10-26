namespace MemoPal.Domain.Education;

public enum EducationMemoryContentType
{
    NotApplicable,
    VocabularyPair,
    OrderedList,
    NumberDate,
    FormulaSymbols,
    CategoryMembership,
    VerbatimText,
    LabelDiagram,
    LanguageItem,
    ConceptUnderstanding,
    ReasoningProcedure
}

public enum EducationContentOrigin
{
    Original,
    PublicDomainConfirmed,
    Imported
}

public enum EducationContentReviewStatus
{
    Unreviewed,
    TeacherReviewed
}

public enum EducationStudyItemStatus
{
    Draft,
    Published
}
