ALTER TABLE quiz_concepts ALTER COLUMN next_review SET DEFAULT CURRENT_DATE + 1;

-- Fix existing new concepts that got today's date
UPDATE quiz_concepts
SET next_review = CURRENT_DATE + 1
WHERE status = 'new' AND next_review <= CURRENT_DATE;
