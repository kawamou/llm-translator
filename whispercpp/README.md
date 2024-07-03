## メモ

- 本来はDockerfileで全部固めてポンやろうと思っていた
- ただWhisper.cppにはCoreMLサポートがありMac側でやった方が良さげ
- Ryeで管理。公式通りbrew使わずcurlで入れた
  - https://qiita.com/Cayden_Madden/items/31f168df833e4b5ec8d4
```
rye init # pyproject.tomlが生成
rye pin 3.10 # pythonのバージョン指定。cpython@3.10.14
rye sync # pythonバイナリがダウンロード。速い！
```

- CoreML関連入れていく
  - https://github.com/ggerganov/whisper.cpp?tab=readme-ov-file#core-ml-support

```
rye add ane_transformers
rye add openai-whisper
rye add coremltools
```

- activateして仮想環境に入れば仮想環境内のpipとか使える

```
. .venv/bin/activate
```

```
.venv ❯ ./models/generate-coreml-model.sh base

make clean
WHISPER_COREML=1 make -j

# https://abe-law-office.jp/v2/whisper-cpp%E3%81%AEcore-ml%E7%89%88%E3%82%92m2-macbook-air%E3%81%A7%E5%8B%95%E3%81%8B%E3%81%99/
bash ./models/download-ggml-model.sh base
```

- 動作確認してみる。初回は遅いが2回目以降はまあまあ速い

```
./main -m models/ggml-base.bin -f samples/jfk.wav

# ３０秒のファイルで↓
# whisper_print_timings:    total time =  4814.22 ms
```



