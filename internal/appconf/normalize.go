package appconf

import (
	"encoding/json"
	"strings"

	"lunabox/internal/utils/proxyutils"
)

func jsonHasField(data []byte, field string) bool {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return false
	}
	_, ok := raw[field]
	return ok
}

func normalizeMetadataSources(sources []string) []string {
	if len(sources) == 0 {
		return cloneStringSlice(defaultMetadataSources)
	}

	result := make([]string, 0, len(defaultMetadataSources))
	seen := make(map[string]struct{}, len(defaultMetadataSources))

	for _, source := range sources {
		normalized := strings.ToLower(strings.TrimSpace(source))
		if normalized == "" {
			continue
		}
		if _, ok := allowedMetadataSourceSet[normalized]; !ok {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}

		seen[normalized] = struct{}{}
		result = append(result, normalized)
	}

	if len(result) == 0 {
		return cloneStringSlice(defaultMetadataSources)
	}
	return result
}

func cloneStringSlice(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	cloned := make([]string, len(values))
	copy(cloned, values)
	return cloned
}

func boolPtr(value bool) *bool {
	v := value
	return &v
}

func NormalizeMCPPort(port int) int {
	if port < 1 || port > 65535 {
		return DefaultMCPPort
	}
	return port
}

func NormalizeProxySettings(config *AppConfig) bool {
	if config == nil {
		return false
	}

	changed := false
	normalizeMode := func(value string) string {
		switch strings.ToLower(strings.TrimSpace(value)) {
		case proxyutils.DownloadProxyModeManual:
			return proxyutils.DownloadProxyModeManual
		case proxyutils.DownloadProxyModeDirect:
			return proxyutils.DownloadProxyModeDirect
		default:
			return proxyutils.DownloadProxyModeSystem
		}
	}
	setMode := func(target *string, fallback string) {
		next := normalizeMode(*target)
		if strings.TrimSpace(*target) == "" && strings.TrimSpace(fallback) != "" {
			next = normalizeMode(fallback)
		}
		if *target != next {
			*target = next
			changed = true
		}
	}

	trimmedProxyURL := strings.TrimSpace(config.DownloadProxyURL)
	if config.DownloadProxyURL != trimmedProxyURL {
		config.DownloadProxyURL = trimmedProxyURL
		changed = true
	}

	legacyMode := config.DownloadProxyMode
	setMode(&config.MetadataProxyMode, "")
	setMode(&config.ImageProxyMode, "")
	setMode(&config.GameDownloadProxyMode, legacyMode)

	normalizedLegacyMode := normalizeMode(config.DownloadProxyMode)
	if config.DownloadProxyMode != normalizedLegacyMode {
		config.DownloadProxyMode = normalizedLegacyMode
		changed = true
	}

	return changed
}
