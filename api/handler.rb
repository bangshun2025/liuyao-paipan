# frozen_string_literal: true

# 六爻排盘 · 测事体系 — 后端
# 挂载于 /api/ext/liuyao-paipan/
# index.html 为纯前端单文件，standalone 路由直接返回页面内容

class LiuyaoPaipanExt < Clacky::ApiExtension
  get "/standalone" do
    html_path = File.join(self.class.ext_dir, "index.html")
    if File.exist?(html_path)
      html = File.read(html_path, encoding: "UTF-8")
      raise Clacky::ApiExtension::Halt.new(200, html, "text/html; charset=utf-8")
    else
      error!("index.html not found", status: 500)
    end
  end

  get "/" do
    json(message: "六爻排盘 · 测事体系 API", endpoints: ["/standalone"])
  end
end
