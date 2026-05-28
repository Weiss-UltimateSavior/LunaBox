package appconf

import (
	"reflect"
	"testing"
)

func TestNormalizeMetadataSourcesAcceptsOptInSources(t *testing.T) {
	got := normalizeMetadataSources([]string{"bangumi", "dlsite", "erogamescape", "DLSITE", "unknown"})
	want := []string{"bangumi", "dlsite", "erogamescape"}

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected %#v, got %#v", want, got)
	}
}

func TestNormalizeMetadataSourcesDefaultsDoNotIncludeOptInSources(t *testing.T) {
	got := normalizeMetadataSources(nil)

	for _, source := range got {
		if source == "dlsite" || source == "erogamescape" {
			t.Fatalf("opt-in source %q should not be enabled by default: %#v", source, got)
		}
	}
}

func TestNormalizeProxySettingsKeepsDownloadProxyURLAsSharedURL(t *testing.T) {
	config := &AppConfig{
		DownloadProxyMode:     "manual",
		DownloadProxyURL:      " 127.0.0.1:7890 ",
		MetadataProxyMode:     "system",
		ImageProxyMode:        "direct",
		GameDownloadProxyMode: "manual",
	}

	if !NormalizeProxySettings(config) {
		t.Fatal("expected proxy normalization to report changes")
	}
	if config.DownloadProxyURL != "127.0.0.1:7890" {
		t.Fatalf("expected shared proxy URL to be trimmed, got %q", config.DownloadProxyURL)
	}
	if config.MetadataProxyMode != "system" || config.ImageProxyMode != "direct" || config.GameDownloadProxyMode != "manual" {
		t.Fatalf("unexpected proxy modes: metadata=%q image=%q download=%q", config.MetadataProxyMode, config.ImageProxyMode, config.GameDownloadProxyMode)
	}
}

func TestProxyConfigMethodsShareManualURL(t *testing.T) {
	config := &AppConfig{
		DownloadProxyURL:      "http://127.0.0.1:7890",
		MetadataProxyMode:     "manual",
		ImageProxyMode:        "direct",
		GameDownloadProxyMode: "system",
	}

	mode, proxyURL := config.MetadataProxyConfig()
	if mode != "manual" || proxyURL != config.DownloadProxyURL {
		t.Fatalf("unexpected metadata proxy config: mode=%q url=%q", mode, proxyURL)
	}
	mode, proxyURL = config.ImageProxyConfig()
	if mode != "direct" || proxyURL != config.DownloadProxyURL {
		t.Fatalf("unexpected image proxy config: mode=%q url=%q", mode, proxyURL)
	}
	mode, proxyURL = config.GameDownloadProxyConfig()
	if mode != "system" || proxyURL != config.DownloadProxyURL {
		t.Fatalf("unexpected game download proxy config: mode=%q url=%q", mode, proxyURL)
	}
}
