import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { UniversalHeaderButton, UniversalHeaderNavItem } from "../lib/landingData";
import { resolveRemoteAsset } from "../lib/landingData";
import { useState } from "react";

type LandingHeaderProps = {
  phone: string;
  email: string;
  logo: string;
  logoAlt?: string;
  navItems: UniversalHeaderNavItem[];
  buttons: UniversalHeaderButton[];
  onLinkPress?: (href: string) => void;
};

const openHref = (href: string, onLinkPress?: (href: string) => void) => {
  if (onLinkPress) {
    onLinkPress(href);
    return;
  }
  if (href.startsWith("/login")) {
    router.push("/login");
    return;
  }
  if (href.startsWith("/register")) {
    router.push("/register");
    return;
  }
  if (href.startsWith("/student-panel")) {
    router.push("/student-panel");
    return;
  }
  if (href.startsWith("/")) {
    router.push(href);
    return;
  }
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    Linking.openURL(href);
  }
};

export default function LandingHeader({
  phone,
  email,
  logo,
  logoAlt,
  navItems,
  buttons,
  onLinkPress,
}: LandingHeaderProps) {
  const resolvedLogo = resolveRemoteAsset(logo);
  const useLocalLogo = logo?.includes("/images/logo.png");
  const hasRemoteLogo = /^https?:\/\//i.test(resolvedLogo);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.brand}>
          {useLocalLogo ? (
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : hasRemoteLogo ? (
            <Image source={{ uri: resolvedLogo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoFallback} />
          )}
          <Text style={styles.brandText}>{logoAlt || "FullStack Learning"}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.menuButton}
          onPress={() => setMenuOpen((prev) => !prev)}
        >
          <View style={styles.hamburger}>
            <View style={[styles.hamburgerBar, menuOpen && styles.hamburgerBarTopOpen]} />
            <View style={[styles.hamburgerBar, menuOpen && styles.hamburgerBarMiddleOpen]} />
            <View style={[styles.hamburgerBar, menuOpen && styles.hamburgerBarBottomOpen]} />
          </View>
        </Pressable>
      </View>

      {menuOpen ? (
        <View style={styles.navPanel}>
          {navItems.map((item) => (
            <Pressable
              key={`${item.label}-${item.href}`}
              style={styles.navItemButton}
              onPress={() => {
                openHref(item.href, onLinkPress);
                setMenuOpen(false);
              }}
            >
              <Text style={styles.navItem}>{item.label}</Text>
            </Pressable>
          ))}
          <View style={styles.menuButtons}>
            {buttons.map((button) => (
              <Pressable
                key={`${button.label}-${button.href}`}
                style={button.style === "outline" ? styles.loginButton : styles.enrollButton}
                onPress={() => {
                  openHref(button.href, onLinkPress);
                  setMenuOpen(false);
                }}
              >
                <Text style={button.style === "outline" ? styles.loginText : styles.enrollText}>
                  {button.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e6fb3",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
  },
  logoFallback: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  brandText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 8,
  },
  hamburger: {
    width: 20,
    height: 16,
    justifyContent: "space-between",
  },
  hamburgerBar: {
    height: 2,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  hamburgerBarTopOpen: {
    transform: [{ translateY: 7 }, { rotate: "45deg" }],
  },
  hamburgerBarMiddleOpen: {
    opacity: 0,
  },
  hamburgerBarBottomOpen: {
    transform: [{ translateY: -7 }, { rotate: "-45deg" }],
  },
  enrollButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  enrollText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  loginButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  loginText: {
    color: "#1e6fb3",
    fontSize: 12,
    fontWeight: "700",
  },
  navRow: {
    marginTop: 12,
    gap: 16,
    paddingHorizontal: 4,
  },
  navItem: {
    color: "#e2f2ff",
    fontSize: 12,
    fontWeight: "600",
  },
  navPanel: {
    marginTop: 12,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  menuButtons: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  navItemButton: {
    paddingVertical: 6,
  },
});
