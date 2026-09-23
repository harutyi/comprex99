const session = new URLSearchParams(location.search).get("session_id");
location.replace("/web/order/" + (session ? "?session_id=" + encodeURIComponent(session) : ""));
