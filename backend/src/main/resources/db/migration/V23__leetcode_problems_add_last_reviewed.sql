ALTER TABLE leetcode_problems ADD COLUMN last_reviewed DATE;
UPDATE leetcode_problems SET last_reviewed = first_attempted;
ALTER TABLE leetcode_problems ALTER COLUMN last_reviewed SET NOT NULL;
