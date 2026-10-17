// A remembered profile in localStorage is not an active login.
// Only an explicit login in this tab creates this versioned session.
const SESSION_KEY = 'flipvoca_student_session_v1';
const PROFILE_KEY = 'english_edu_current_user';

export function readStudentSession() {
  try {
    const user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    const id = user?.student_id || user?.id;
    if (typeof id !== 'string' || !id.trim() || typeof user?.name !== 'string' || !user.name.trim()) return null;
    return user;
  } catch {
    return null;
  }
}

export function saveStudentSession(user) {
  const serialized = JSON.stringify(user);
  sessionStorage.setItem(SESSION_KEY, serialized);
  // Keep profile consumers compatible without treating this older key as login proof.
  sessionStorage.setItem(PROFILE_KEY, serialized);
}

export function clearStudentSession() {
  for (const key of [SESSION_KEY, PROFILE_KEY, 'english_edu_logged_user', 'english_edu_main_tab']) {
    try { sessionStorage.removeItem(key); } catch {}
  }
  for (const key of [PROFILE_KEY, 'english_edu_logged_user']) {
    try { localStorage.removeItem(key); } catch {}
  }
}
