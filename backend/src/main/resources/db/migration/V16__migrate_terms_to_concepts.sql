-- Migrate vocabulary_words into quiz_concepts as grouped HTML lists.
-- Each group = same (topic_id, DATE(created_at)).
-- Name comes from vocab_date_labels if exists, else 'Terms — Mon DD'.
-- next_review = MIN(next_review) from group to preserve scheduling.

INSERT INTO quiz_concepts (topic_id, name, content, next_review, created_at, updated_at)
SELECT
    vw.topic_id,
    COALESCE(vdl.label, 'Terms — ' || TO_CHAR(DATE(vw.created_at), 'Mon DD')),
    '<ul>' || STRING_AGG('<li>' || vw.word || '</li>', '' ORDER BY vw.word) || '</ul>',
    MIN(vw.next_review),
    MIN(vw.created_at),
    NOW()
FROM vocabulary_words vw
LEFT JOIN vocab_date_labels vdl
    ON vdl.topic_id = vw.topic_id AND vdl.added_date = DATE(vw.created_at)
GROUP BY vw.topic_id, DATE(vw.created_at), vdl.label
ON CONFLICT (topic_id, name) DO NOTHING;
