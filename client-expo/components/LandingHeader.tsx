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
};

const openHref = (href: string) => {
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
  if (href.startsWith("http")) {
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
}: LandingHeaderProps) {
  const resolvedLogo = resolveRemoteAsset(logo);
  const useLocalLogo = logo?.includes("/images/logo.png");
  const hasRemoteLogo = /^https?:\/\//i.test(resolvedLogo);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.topText}>{phone}</Text>
        <Text style={styles.topDivider}>|</Text>
        <Text style={styles.topText}>{email}</Text>
      </View>

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

        <View style={styles.actions}>
          {buttons.map((button) => (
            <Pressable
              key={`${button.label}-${button.href}`}
              style={button.style === "outline" ? styles.loginButton : styles.enrollButton}
              onPress={() => openHref(button.href)}
            >
              <Text style={button.style === "outline" ? styles.loginText : styles.enrollText}>
                {button.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.menuButton}
          onPress={() => setMenuOpen((prev) => !prev)}
        >
          <Text style={styles.menuButtonText}>{menuOpen ? "Close" : "Menu"}</Text>
        </Pressable>
      </View>

      {menuOpen ? (
        <View style={styles.navPanel}>
          {navItems.map((item) => (
            <Pressable
              key={`${item.label}-${item.href}`}
              style={styles.navItemButton}
              onPress={() => {
                openHref(item.href);
                setMenuOpen(false);
              }}
            >
              <Text style={styles.navItem}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navRow}
        >
          {navItems.map((item) => (
            <Pressable key={`${item.label}-${item.href}`} onPress={() => openHref(item.href)}>
              <Text style={styles.navItem}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
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
  topRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  topText: {
    color: "#e2f2ff",
    fontSize: 12,
  },
  topDivider: {
    color: "#e2f2ff",
    fontSize: 12,
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
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 8,
  },
  menuButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
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
  navItemButton: {
    paddingVertical: 6,
  },
});
