---
name: tax-refund-check
description: Use this when working on the tax refund eligibility checker, refund estimation logic, follow-up tax questions, and internal email payloads for the refund-check website.
---

# Tax Refund Check Skill

## Purpose
This skill defines how the tax refund checker should work so results are based on both Form 106 and questionnaire answers.

## Rules
- Never ignore questionnaire answers silently.
- Any tax-relevant answer must either:
  - affect the result
  - trigger follow-up questions
  - appear in missingData
  - or be removed from the UI

## Relevant topics
- donations
- life insurance
- unpaid leave
- reserve duty
- maternity leave / parental leave
- multiple employers

## Behavior
- If donations = yes and amount is missing, ask a follow-up question.
- If life insurance = yes and annual amount is missing, ask a follow-up question.
- If unpaid leave / reserve duty / maternity leave is relevant but details are missing, ask follow-up questions.
- Include all questionnaire answers, follow-up answers, final result, reasons, and missingData in the internal email.
- Use one shared structured object for UI result, backend persistence, and email payload.
