# 夜航电台 Nightwave FM

一个可交互的深夜城市电台单页网站。调节旋钮会在六个真实 FM 频道之间切换，支持真实电台直播、收藏、随机漫游、拖动与键盘控制。浏览器会在用户点击播放后连接当前频道的公开直播流。

## 真实频率

频率按低到高排列，资料来自公开频道页面，覆盖范围以当地实际接收情况为准：

- 拉萨综合广播：FM 91.4（[拉萨人民广播电台](https://baike.baidu.com/item/%E6%8B%89%E8%90%A8%E4%BA%BA%E6%B0%91%E5%B9%BF%E6%92%AD%E7%94%B5%E5%8F%B0/913876)）
- 上海经典947：FM 94.7（[经典947](https://baike.baidu.com/item/%E7%BB%8F%E5%85%B8947/14579204)）
- 重庆之声：FM 96.8（[重庆之声](https://baike.baidu.com/item/%E9%87%8D%E5%BA%86%E4%B9%8B%E5%A3%B0/6154999)）
- 伊犁察布查尔广播：FM 99.5（[蜻蜓 FM 频道页](https://www.qtfm.cn/radios/5022610/)）
- 大连新闻综合广播：FM 103.3（[World Radio Map](https://worldradiomap.com/cn/play/ln_dalian-xinwen)）
- 广州交通广播：FM 106.1（[广州广播电视台交通广播](https://baike.baidu.com/item/%E5%B9%BF%E5%B7%9E%E5%B9%BF%E6%92%AD%E7%94%B5%E8%A7%86%E5%8F%B0%E4%BA%A4%E9%80%9A%E5%B9%BF%E6%92%AD/56105186)）

## 直播流

六个频道均使用蜻蜓 FM 的公开 HTTPS 音频流。直播源由第三方平台提供，可能因平台维护、地区网络或频道调整暂时中断；页面会显示连接、缓冲、暂停和错误状态。

## 本地预览

直接打开 `index.html` 即可使用。也可以在目录中运行任意静态文件服务器。

## 发布

项目为零构建依赖的静态站点，可直接部署到 GitHub Pages、Netlify 或 Vercel。
