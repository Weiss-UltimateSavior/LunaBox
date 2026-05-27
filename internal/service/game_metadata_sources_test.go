package service

import (
	"context"
	"reflect"
	"testing"

	"lunabox/internal/appconf"
	"lunabox/internal/common/enums"
	"lunabox/internal/common/vo"
)

func TestGameServiceConfiguredMetadataSourcesPreservesOptInSources(t *testing.T) {
	svc := NewGameService()
	svc.Init(context.Background(), nil, &appconf.AppConfig{
		MetadataSources: []string{
			string(enums.Bangumi),
			string(enums.DLsite),
			string(enums.ErogameScape),
			string(enums.DLsite),
		},
	})

	got := svc.getConfiguredMetadataSources()
	want := []enums.SourceType{enums.Bangumi, enums.DLsite, enums.ErogameScape}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected %#v, got %#v", want, got)
	}
}

func TestGameServiceConfiguredMetadataSearchSourcesIncludesOptInSources(t *testing.T) {
	svc := NewGameService()
	svc.Init(context.Background(), nil, &appconf.AppConfig{
		MetadataSources: []string{string(enums.DLsite), string(enums.ErogameScape)},
	})

	sources := svc.getConfiguredMetadataSearchSources()
	got := make([]enums.SourceType, 0, len(sources))
	for _, source := range sources {
		got = append(got, source.source)
	}

	want := []enums.SourceType{enums.DLsite, enums.ErogameScape}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected %#v, got %#v", want, got)
	}
}

func TestGameServiceMetadataSourceEnabledUsesConfiguredSources(t *testing.T) {
	svc := NewGameService()
	svc.Init(context.Background(), nil, &appconf.AppConfig{
		MetadataSources: []string{" Steam "},
	})

	if !svc.isMetadataSourceEnabled(enums.Steam) {
		t.Fatal("expected configured Steam source to be enabled")
	}

	if svc.isMetadataSourceEnabled(enums.VNDB) {
		t.Fatal("expected VNDB source to be disabled")
	}

	if svc.isMetadataSourceEnabled(enums.Local) {
		t.Fatal("expected local source to be disabled for metadata refresh")
	}
}

func TestGameServiceFetchMetadataResultByRequestRejectsInvalidOptInSourceIDs(t *testing.T) {
	svc := NewGameService()
	svc.Init(context.Background(), nil, &appconf.AppConfig{})

	tests := []vo.MetadataRequest{
		{Source: enums.DLsite, ID: "BAD123"},
		{Source: enums.ErogameScape, ID: "game-123"},
	}

	for _, tt := range tests {
		if _, err := svc.fetchMetadataResultByRequest(tt); err == nil {
			t.Fatalf("expected invalid ID error for %#v", tt)
		}
	}
}
