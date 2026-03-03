package com.example.pdfjs;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PdfjsGateUtil {
  private PdfjsGateUtil() {}

  // UA 文字列から主要ブラウザのメジャーバージョンを抽出するための事前コンパイル正規表現。
  private static final Pattern EDGE_MAJOR_PATTERN = Pattern.compile("Edg/(\\d+)");
  private static final Pattern CHROME_MAJOR_PATTERN = Pattern.compile("Chrome/(\\d+)");
  private static final Pattern FIREFOX_MAJOR_PATTERN = Pattern.compile("Firefox/(\\d+)");

  // UA 判定結果を "v2" または "v5" で返す（呼び出し側がそのまま使える形）。
  public static String suggestVersionFromUa(String userAgent) {
    return isUaOkForV5(userAgent) ? "v5" : "v2";
  }

  // v5 候補にできるブラウザのみ true を返す。
  // 閾値:
  // - Edge(Chromium): 110+
  // - Chrome: 110+
  // - Firefox: 115+
  // - Safari: 16.4+
  public static boolean isUaOkForV5(String userAgent) {
    if (userAgent == null || userAgent.trim().isEmpty()) return false;
    String ua = userAgent.trim();

    int edgeMajor = parseMajor(ua, EDGE_MAJOR_PATTERN);
    if (edgeMajor >= 0) return edgeMajor >= 110;

    int chromeMajor = parseMajor(ua, CHROME_MAJOR_PATTERN);
    if (chromeMajor >= 0) {
      // Chromium Edge / Opera / iOS Chrome は Chrome 判定から除外する。
      if (ua.contains("Edg/") || ua.contains("OPR/") || ua.contains("CriOS/")) return false;
      return chromeMajor >= 110;
    }

    int firefoxMajor = parseMajor(ua, FIREFOX_MAJOR_PATTERN);
    if (firefoxMajor >= 0) return firefoxMajor >= 115;

    int[] safari = parseSafariVersion(ua);
    if (safari != null) return compareMajorMinor(safari[0], safari[1], 16, 4) >= 0;

    return false;
  }
  // 正規表現で UA からメジャーバージョンを抽出する。
  // 見つからない、または数値化できない場合は -1 を返す。
  private static int parseMajor(String userAgent, Pattern pattern) {
    Matcher matcher = pattern.matcher(userAgent);
    if (!matcher.find()) return -1;
    try {
      return Integer.parseInt(matcher.group(1));
    } catch (Exception ignored) {
      return -1;
    }
  }

  // Safari は Version/x.y を優先して解析する。
  // Chrome/Edge/Opera など Safari 互換 UA は誤判定防止のため除外する。
  private static int[] parseSafariVersion(String userAgent) {
    if (!userAgent.contains("Safari/")) return null;
    if (userAgent.contains("Chrome/") || userAgent.contains("Chromium/") || userAgent.contains("Edg/") || userAgent.contains("OPR/")) {
      return null;
    }

    String token = "Version/";
    int index = userAgent.indexOf(token);
    if (index < 0) return null;

    int start = index + token.length();
    int end = userAgent.indexOf(' ', start);
    if (end < 0) end = userAgent.length();

    String[] parts = userAgent.substring(start, end).split("\\.");
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

  // major/minor の大小比較を行う。
  private static int compareMajorMinor(int aMajor, int aMinor, int bMajor, int bMinor) {
    if (aMajor != bMajor) return aMajor - bMajor;
    return aMinor - bMinor;
  }
}
