INSERT INTO "User" (uid, email, password, username, role) VALUES (0, 'system@admin.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'SystemAdmin', 'admin') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (1000, 'system2@admin.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'SystemAdmin2', 'admin') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (2000, 'user2@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user2', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (3000, 'user3@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user3', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (4000, 'user4@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user4', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (5000, 'user5@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user5', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (6000, 'user6@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user6', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (7000, 'user7@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user7', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (8000, 'user8@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user8', 'user') ON CONFLICT (uid) DO NOTHING;
INSERT INTO "User" (uid, email, password, username, role) VALUES (9000, 'user9@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'user9', 'user') ON CONFLICT (uid) DO NOTHING;
-- Banned users
-- no appeal
INSERT INTO "User" (uid, email, password, username, role, "isBan") VALUES (20000, 'banned@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'banned', 'user', true) ON CONFLICT (uid) DO NOTHING;
--toxic apeal
INSERT INTO "User" (uid, email, password, username, role, appeal, "isBan") VALUES (21000, 'banned1@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'banned1', 'user', 'I AM NOT SORRY', true) ON CONFLICT (uid) DO NOTHING;
-- sincere appeal
INSERT INTO "User" (uid, email, password, username, role, appeal, "isBan") VALUES (22000, 'banned2@email.com', '$2b$04$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'banned2', 'user', 'I AM SORRY PLEASE UNBAN ME I LOVE ARSENAL', true) ON CONFLICT (uid) DO NOTHING;


INSERT INTO "Threads" (tid, "ownerId", "teamId", title, closed, text, tags) VALUES (60000, 2000, NULL, 'First Time on here, how is everyone!!', false, 'Hello!', 'tag') ON CONFLICT (tid) DO NOTHING;
INSERT INTO "Threads" (tid, "ownerId", "teamId", title, closed, text, tags) VALUES (61000, 2000, NULL, 'Adrian Kmiec is hot!', false, 'Tall Polish man golly', 'tag') ON CONFLICT (tid) DO NOTHING;
INSERT INTO "Comment" (cid, "ownerId", "threadId", text) VALUES (10000, 3000, 60000, 'good! I love Fent!') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Comment" ("ownerId", "threadId", "parentCommentId", text) VALUES (3000, 60000, 10000, 'me Too. yumy') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Threads" (tid, "ownerId", "teamId", title, closed, text, tags) VALUES (62000, 3000, NULL, 'manchester wow', false, 'man', 'tag') ON CONFLICT (tid) DO NOTHING;
INSERT INTO "Comment" ("ownerId", "threadId", text) VALUES (4000, 60000, 'good! I love Fent!') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Comment" ("ownerId", "threadId", text) VALUES (5000, 61000, 'he is wow') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Comment" ("ownerId", "threadId", text) VALUES (6000, 61000, 'large') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Comment" (cid, "ownerId", "threadId", text) VALUES (25000, 6000, 61000, 'poll!') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Poll" ("commentId", deadline, option1, option2, "option1Score", "option2Score") VALUES (25000, NOW() + INTERVAL '14 days', 'Yes', 'hell nah', 0, 0) ON CONFLICT (pid) DO NOTHING;


-- Toxic thread and comments
INSERT INTO "Threads" (tid, "ownerId", "teamId", title, closed, text, tags) VALUES (63000, 8000, NULL, 'i am so toxic', false, 'toxic ahhhh', 'toxic') ON CONFLICT (tid) DO NOTHING;
INSERT INTO "Comment" ("ownerId", "threadId", text) VALUES (7000, 62000, 'report me') ON CONFLICT (cid) DO NOTHING;
INSERT INTO "Comment" (cid, "ownerId", "threadId", text) VALUES (30000, 7000, 63000, 'toxic comment') ON CONFLICT (cid) DO NOTHING;


-- reports on toxic comment/thread
INSERT INTO "Reports" ("threadId", "userId", text) VALUES (63000, 5000, 'so toxic wow') ON CONFLICT (rid) DO NOTHING;
INSERT INTO "Reports" ("commentId", "userId", text) VALUES (30000, 5000, 'horrible') ON CONFLICT (rid) DO NOTHING;
