# Material catalog

Registry of every kind of didactic material can be produced. 
Every authoring subagent `learning-<TYPE>-author` and the
`learning-material-author` orchestrating skill read this file instead of re-deriving the
mapping. 

Trigger values (`delivery_style`, `item_type`, `support_material_kind`) are the enums defined in
`reference/curriculum.schema.json`. Read that schema, do not guess at its enum values.

# Materials

## Material 1

```
type: Course Slides
audience: Students
preferred_formats: PowerPoint
owning_subagent: learning-slides-author
trigger: One per session, learner-facing content only, used by teacher
path_pattern: `material/student/slides/`
filename_pattern: `slides.pptx`
```

## Material 2

```
type: Student book
audience: Student
preferred_formats: AsciiDoc
owning_subagent: learning-student-book-author
trigger: One per whole course, learner-facing content only
path_pattern: `material/student/books/`
filename_pattern: `student-book.adoc`
```

## Material 3

```
type: engagement quiz
audience: Student
preferred_formats: Markdown
owning_subagent: learning-quiz-author
trigger: Used in the curriculum to summarize the main cocepts of the knowledge recently thaught
path_pattern: `material/teacher/quizzes/`
filename_pattern: `<node_ref>-engagement-quiz.md`
```

## Material 4

```
type: prereq-check quiz
audience: Student
preferred_formats: Markdown
owning_subagent: learning-quiz-author
trigger: One per couse, used once before the course to check if all students have the requires prerequisites to tackle the course and quickly teach the missing knowledge if needed.
path_pattern: `material/teacher/quizzes/`
filename_pattern: `prereq-check-quiz.md`
```

## Material 5

```
type: assessment quiz
audience: Student
preferred_formats: Markdown
owning_subagent: learning-quiz-author
trigger: One per couse, used once at the end of the course to evaluate and score how well students acquired the knowledge that has been thaught.
path_pattern: `material/teacher/quizzes/`
filename_pattern: `assessment-quiz.md`
```

`node_ref` in a filename is the item's own `node_ref`.

