DELETE FROM vocabulary_reviews;
DELETE FROM vocabulary_words;
ALTER TABLE vocabulary_words DROP CONSTRAINT vocabulary_words_user_id_word_key;
ALTER TABLE vocabulary_words DROP COLUMN user_id;
ALTER TABLE vocabulary_words ADD COLUMN topic_id BIGINT NOT NULL REFERENCES quiz_topics(id) ON DELETE CASCADE;
ALTER TABLE vocabulary_words ADD CONSTRAINT vocabulary_words_topic_id_word_key UNIQUE(topic_id, word);
CREATE INDEX idx_vw_topic ON vocabulary_words(topic_id);
