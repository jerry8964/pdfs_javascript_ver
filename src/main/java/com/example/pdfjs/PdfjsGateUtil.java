package com.example.pdfjs;

import javax.servlet.http.Cookie;
import java.util.Locale;

public final class PdfjsGateUtil {
  private PdfjsGateUtil() {}

  public static final String PREF_COOKIE_NAME = "pdfjs_pref";
  public static final int DEFAULT_TTL_DAYS = 7;

  // Cookie に保存された最終判定（v2/v5）を読み取る。
  public static String readPrefFromCookies(Cookie[] cookies) {
    if (cookies == null) return null;
    for (Cookie cookie : cookies) {
      if (cookie == null) continue;
      if (!PREF_COOKIE_NAME.equals(cookie.getName())) continue;
      String value = normalizePref(cookie.getValue());
      if (value != null) return value;
    }
    return null;
  }

  // TTL 日数は正の整数のみ有効とし、無効値は既定値へフォールバックする。
  public static int resolveTtlDays(String raw) {
    if (raw == null) return DEFAULT_TTL_DAYS;
    try {
      int days = Integer.parseInt(raw.trim());
      return days > 0 ? days : DEFAULT_TTL_DAYS;
    } catch (Exception ignored) {
      return DEFAULT_TTL_DAYS;
    }
  }

  // UA 判定は v5 を安全に許可できる場合のみ true を返す。
  public static boolean isUaOkForV5(String userAgent) {
    if (userAgent == null || userAgent.trim().isEmpty()) return false;
    String ua = userAgent.trim();

    if (isSuspiciousUserAgent(ua)) return false;
    if (isIE11(ua) || ua.contains("Edge/")) return false;

    // ブラウザ種別は短絡評価で判定する。
    // 先に一致した分岐で即時 return するため、閾値の保守が追いやすい。
    int edgeMajor = parseMajor(ua, "Edg/");
    if (edgeMajor > 0) return edgeMajor >= 110;

    int chromeMajor = parseMajor(ua, "Chrome/");
    if (chromeMajor > 0) return chromeMajor >= 110;

    int firefoxMajor = parseMajor(ua, "Firefox/");
    if (firefoxMajor > 0) return firefoxMajor >= 128;

    int[] safari = parseSafariVersion(ua);
    if (safari != null) return compareMajorMinor(safari[0], safari[1], 16, 4) >= 0;

    return false;
  }

  private static String normalizePref(String raw) {
    if (raw == null) return null;
    String value = raw.trim().toLowerCase(Locale.ROOT);
    if ("v2".equals(value) || "v5".equals(value)) return value;
    return null;
  }

  private static boolean isIE11(String userAgent) {
    return userAgent.contains("Trident/7.0") && userAgent.contains("rv:11.0");
  }

  private static boolean isSuspiciousUserAgent(String userAgent) {
    if (userAgent.length() < 20) return true;
    String lower = userAgent.toLowerCase(Locale.ROOT);
    if (lower.contains("headless") || lower.contains("phantomjs") || lower.contains("bot")) return true;

    boolean hasChrome = userAgent.contains("Chrome/");
    boolean hasEdg = userAgent.contains("Edg/");
    boolean hasFirefox = userAgent.contains("Firefox/");
    boolean hasSafari = userAgent.contains("Safari/");
    boolean hasVersion = userAgent.contains("Version/");

    if (hasFirefox && hasChrome) return true;
    if (hasEdg && !hasChrome) return true;
    if (hasSafari && !hasVersion && !hasChrome && !hasEdg) return true;
    return false;
  }

  private static int parseMajor(String userAgent, String token) {
    int index = userAgent.indexOf(token);
    if (index < 0) return -1;
    int start = index + token.length();
    int end = start;
    while (end < userAgent.length()) {
      char ch = userAgent.charAt(end);
      if (ch < '0' || ch > '9') break;
      end++;
    }
    if (end == start) return -1;
    try {
      return Integer.parseInt(userAgent.substring(start, end));
    } catch (Exception ignored) {
      return -1;
    }
  }

  // Safari は Version/x.y を優先し、Chrome/Edge 系 UA は除外する。
  private static int[] parseSafariVersion(String userAgent) {
    if (!userAgent.contains("Safari/")) return null;
    if (userAgent.contains("Chrome/") || userAgent.contains("Chromium/") || userAgent.contains("Edg/")) return null;

    String token = "Version/";
    int index = userAgent.indexOf(token);
    if (index < 0) return null;

    int start = index + token.length();
    int end = userAgent.indexOf(' ', start);
    if (end < 0) end = userAgent.length();
    String version = userAgent.substring(start, end);
    String[] parts = version.split("\\.");
    if (parts.length == 0) return null;

    int major;
    int minor = 0;
    try {
      major = Integer.parseInt(parts[0]);
    } catch (Exception ignored) {
      return null;
    }
    if (parts.length > 1) {
      try {
        minor = Integer.parseInt(parts[1]);
      } catch (Exception ignored) {
        minor = 0;
      }
    }
    return new int[] { major, minor };
  }

  private static int compareMajorMinor(int aMajor, int aMinor, int bMajor, int bMinor) {
    if (aMajor != bMajor) return aMajor - bMajor;
    return aMinor - bMinor;
  }

}
