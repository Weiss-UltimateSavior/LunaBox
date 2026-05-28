import type { appconf } from "../../../wailsjs/go/models";
import { useTranslation } from "react-i18next";
import { BetterSelect } from "../ui/better/BetterSelect";

interface ProxySettingsPanelProps {
  formData: appconf.AppConfig;
  onChange: (data: appconf.AppConfig) => void;
}

type ProxyField
  = | "metadata_proxy_mode"
    | "image_proxy_mode"
    | "game_download_proxy_mode";

interface ProxyTarget {
  field: ProxyField;
  labelKey: string;
  labelFallback: string;
  hintKey: string;
  hintFallback: string;
}

const proxyTargets: ProxyTarget[] = [
  {
    field: "metadata_proxy_mode",
    labelKey: "settings.proxy.metadata",
    labelFallback: "元数据刮取",
    hintKey: "settings.proxy.metadataHint",
    hintFallback: "Bangumi、VNDB、Steam、DLsite 等元数据请求。",
  },
  {
    field: "image_proxy_mode",
    labelKey: "settings.proxy.image",
    labelFallback: "图片下载",
    hintKey: "settings.proxy.imageHint",
    hintFallback: "封面、头像等远程图片缓存。",
  },
  {
    field: "game_download_proxy_mode",
    labelKey: "settings.proxy.gameDownload",
    labelFallback: "游戏下载",
    hintKey: "settings.proxy.gameDownloadHint",
    hintFallback: "下载管理中的游戏压缩包和安装包。",
  },
];

export function ProxySettingsPanel({
  formData,
  onChange,
}: ProxySettingsPanelProps) {
  const { t } = useTranslation();
  const modeOptions = [
    {
      value: "system",
      label: t("settings.proxy.modeSystem", "自动跟随系统代理"),
    },
    { value: "manual", label: t("settings.proxy.modeManual", "使用手动代理") },
    {
      value: "direct",
      label: t("settings.proxy.modeDirect", "直连，不使用代理"),
    },
  ];
  const hasManualProxy = proxyTargets.some(
    target => (formData[target.field] || "system") === "manual",
  );

  const updateMode = (field: ProxyField, value: string) => {
    onChange({ ...formData, [field]: value } as appconf.AppConfig);
  };

  return (
    <div className="space-y-4">
      {proxyTargets.map(target => (
        <div key={target.field} className="space-y-2">
          <label className="block text-sm font-medium text-brand-700 dark:text-brand-300">
            {t(target.labelKey, target.labelFallback)}
          </label>
          <BetterSelect
            value={formData[target.field] || "system"}
            onChange={value => updateMode(target.field, value)}
            options={modeOptions}
          />
          <p className="text-xs text-brand-500 dark:text-brand-400">
            {t(target.hintKey, target.hintFallback)}
          </p>
        </div>
      ))}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-brand-700 dark:text-brand-300">
          {t("settings.proxy.manualProxyURL", "手动代理 URL")}
        </label>
        <p className="text-xs text-brand-500 dark:text-brand-400">
          {t(
            "settings.proxy.manualProxyURLHint",
            "当任一类型选择手动代理时使用。支持 http://、https://、socks5://，也可直接填写 127.0.0.1:7890。",
          )}
        </p>
        <input
          type="text"
          value={formData.download_proxy_url || ""}
          onChange={e =>
            onChange({
              ...formData,
              download_proxy_url: e.target.value,
            } as appconf.AppConfig)}
          placeholder={t(
            "settings.proxy.manualProxyURLPlaceholder",
            "例如 http://127.0.0.1:7890",
          )}
          className="glass-input w-full rounded-md border border-brand-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:border-brand-600 dark:bg-brand-700 dark:text-white"
        />
        {!hasManualProxy && (
          <p className="text-xs text-brand-400 dark:text-brand-500">
            {t(
              "settings.proxy.manualProxyURLIdle",
              "当前没有类型使用手动代理，此地址会先保存但暂不生效。",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
