#!/usr/bin/env node
/**
 * 클로드 코드 필수 스킬 6개 설치기 — **설치하고, 진짜 되는지 확인까지 한다.**
 *
 *   node install.mjs              설치 + 검증
 *   node install.mjs --check      설치하지 않고 지금 상태만 본다
 *   node install.mjs --only gsd   하나만
 *   node install.mjs --skip gsd   그것만 빼고 (여러 개면 쉼표)
 *   node install.mjs --self-test  검사기 자체 시험(설치 안 함)
 *
 * ★★**몇 개가 깔리는지 화면에 적는다.**
 *   여섯 중 다섯은 스킬 폴더를 정확히 하나씩 만든다. GSD 하나만 다르다 —
 *   자기 설치기가 `gsd-*` 를 **70여 개 한 덩어리로** 심는다. 쪼갤 방법이 없다.
 *   그걸 안 적으면 우리는 "6개"라고 말하고 76개를 깔게 된다. 고객이 고른 적 없는 70개다.
 *   그래서 ① 설치 전에 개수를 적고 ② `--skip gsd` 로 뺄 길을 준다.
 *   (2026-08-24 실측: 이 PC 스킬 90개 중 71개가 gsd-*)
 *
 * ★★왜 이걸 만드나
 *   남들은 "이거 설치하세요" 목록을 준다. 고객은 여섯 번 설치하고,
 *   **되는지는 모른 채** 넘어간다. "설치했는데 안 되네"가 거기서 나온다.
 *   이 설치기의 값은 설치가 아니라 **설치 뒤에 다시 확인하는 것**이다.
 *
 * ★★종료코드로 판정하지 않는다.
 *   설치 명령이 0 으로 끝나도 스킬이 안 붙어 있을 수 있고, 0이 아니어도 붙어 있을 수 있다
 *   (실제로 겪었다 — 자가점검이 걸려 비0 인데 적용은 성공해 있었다).
 *   **끝나고 나서 실제로 목록에 뜨는지, 파일이 있는지**를 다시 본다.
 *
 * ★★두 축으로 본다.
 *   ① `skills list -g` 에 이름이 뜨는가 (CLI 가 아는가)
 *   ② `SKILL.md` 가 실제로 있고 머리말이 온전한가 (파일이 있는가)
 *   하나만 통과하면 통과라고 하지 않는다 — 어긋났다는 사실을 그대로 말한다.
 *
 * ★파일을 복사해 동봉하지 않는다(벤더링 금지).
 *   각 스킬의 **공식 설치 명령을 부른다.** 버전이 뒤처지지 않고, 라이선스 의무(원문 동봉·변경 고지)도
 *   지킬 일이 없다. GSD 는 README 가 파일 직접 복사를 **명시적으로 금지**하기도 한다.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import https from "node:https";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = homedir();
const 여기 = dirname(fileURLToPath(import.meta.url));
const 인자 = process.argv.slice(2);
const 확인만 = 인자.includes("--check");
const 자기시험 = 인자.includes("--self-test");
const 하나만 = (() => { const i = 인자.indexOf("--only"); return i >= 0 ? 인자[i + 1] : null; })();
/** `--skip gsd` · `--skip gsd,taste` — 뺄 것. 없는 이름을 적으면 아래에서 잡아 준다. */
export const 건너뛰기파싱 = (a) => {
  const 모음 = [];
  for (let i = 0; i < a.length; i++) if (a[i] === "--skip" && a[i + 1] && !a[i + 1].startsWith("--"))
    모음.push(...a[i + 1].split(",").map((x) => x.trim()).filter(Boolean));
  return 모음;
};
const 건너뛴다 = 건너뛰기파싱(인자);

const c = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", d: "\x1b[90m", cy: "\x1b[36m", b: "\x1b[1m", 0: "\x1b[0m" };
const 원 = (n) => Number(n).toLocaleString("ko-KR");

/* ── 무엇을 깔 것인가 ────────────────────────────────────────────────────
   ★출처와 라이선스를 **화면에 적는다.** 남의 것을 대신 깔아 주는 일이라,
     누가 만든 건지 고객이 알아야 한다. 우리가 만든 척하지 않는다. */
const 스킬들 = [
  {
    id: "agent-browser",
    이름: "에이전트 브라우저",
    한줄: "클로드에게 진짜 브라우저를 준다 — 클릭·페이지 열기·사용자처럼 테스트",
    출처: "vercel-labs/agent-browser",
    만든곳: "Vercel Labs",
    라이선스: "Apache-2.0",
    /* ★`--skill` 로 못 박는다. 2026-08-24 확인 시점에 이 저장소의 skills/ 에는 agent-browser 하나뿐이라
         안 박아도 결과는 같았다. 그래도 박는 이유는 **남의 저장소이기 때문**이다 —
         Vercel 이 스킬을 하나 더 넣는 날, 우리 설치기는 고객이 고른 적 없는 것을 조용히 깐다. */
    설치: ["skills", "add", "vercel-labs/agent-browser", "--skill", "agent-browser", "-g", "-a", "claude-code", "-y"],
    검증이름: "agent-browser",
  },
  {
    id: "find-skills",
    이름: "파인드 스킬",
    한줄: "만들 걸 말하면 스킬을 전부 뒤져 맞는 걸 찾아준다",
    출처: "vercel-labs/skills",
    만든곳: "Vercel Labs",
    라이선스: "MIT",
    설치: ["skills", "add", "vercel-labs/skills", "--skill", "find-skills", "-g", "-a", "claude-code", "-y"],
    검증이름: "find-skills",
  },
  {
    id: "gsd",
    이름: "GSD (Get Shit Done)",
    한줄: "긴 대화에서 길 잃지 않게 작업을 잘게 쪼갠다",
    출처: "open-gsd/gsd-core",
    만든곳: "OpenGSD (원저자 TÂCHES)",
    라이선스: "MIT",
    /* ★GSD 만 다른 길이다. 자기 설치기가 따로 있다(런타임·전역/로컬을 묻는다 — stdin 이 비면 기본값).
       ★README 가 파일 직접 복사를 금지한다. 반드시 이 CLI 로만 붙인다.
       ★★검증 이름을 조심할 것: GSD 는 `get-shit-done` 이라는 스킬을 만들지 **않는다.**
         `gsd-new-project` 같은 **`gsd-*` 70여 개**를 깐다. 2026-08-19 첫 실행에서
         `get-shit-done` 을 찾다가 **성공한 설치를 실패로 보고했다** — 그게 제일 나쁜 오답이다
         (고객은 다시 돌리고, 또 실패로 보고, 우리를 못 믿게 된다). */
    설치: ["@opengsd/gsd-core@latest"],
    /* ★★여섯 중 **유일하게 한 덩어리**다. 화면에 개수를 적는다(2026-08-24 실측 71개).
         숫자는 GSD 판올림마다 달라진다 — 그래서 "여" 를 붙여 어림수로 말한다. */
    덩어리: "gsd-* 스킬 70여 개가 한 덩어리로 들어옵니다 (2026-08-24 실측 71개). GSD 는 쪼개 깔 수 없습니다 — 빼려면 --skip gsd",
    검증이름: "gsd-new-project",
    검증대안: ["gsd-help", "gsd-next", "gsd-progress"],
    손으로: "npx @opengsd/gsd-core@latest",
  },
  {
    id: "taste",
    이름: "테이스트",
    한줄: "AI 티 나는 디자인 탈출 — 애니메이션까지 있는 미려한 웹",
    출처: "Leonxlnx/taste-skill",
    만든곳: "Leonxlnx",
    라이선스: "MIT",
    // ⚠️ 같은 이름의 저장소가 여럿이다. 우리가 고른 건 이것이라고 화면에 적는다.
    주의: "같은 이름 저장소가 여럿입니다. 이 설치기는 Leonxlnx 것을 씁니다.",
    설치: ["skills", "add", "https://github.com/Leonxlnx/taste-skill", "--skill", "design-taste-frontend", "-g", "-a", "claude-code", "-y"],
    검증이름: "design-taste-frontend",
    검증대안: ["taste", "taste-skill"],
  },
  {
    id: "mcp-builder",
    이름: "MCP 빌더",
    한줄: "연결할 도구만 알려주면 몇 분 만에 클로드와 붙여준다",
    출처: "anthropics/skills",
    만든곳: "Anthropic (공식)",
    라이선스: "Apache-2.0",
    설치: ["skills", "add", "anthropics/skills", "--skill", "mcp-builder", "-g", "-a", "claude-code", "-y"],
    검증이름: "mcp-builder",
  },
  {
    /* ★여섯 번째. 앞의 다섯과 **설치 방식이 다르다** — 파이썬 패키지다.
         공식 명령: `pip install graphifyy && graphify install`
         (PyPI 이름이 임시로 `graphifyy` 다. CLI·스킬 이름은 그대로 `graphify`.)

       ★우리는 `python -m` 으로 부른다. 원저작자 README 도 인정하듯 윈도우에서
         `graphify` 실행파일이 PATH 에 안 잡히는 일이 흔하다. `python -m graphify`
         는 그 문제를 통째로 비켜 간다 — 같은 코드를 부르면서 PATH 를 안 탄다.

       ★검증축이 **파일 하나뿐**이다(검증축:"파일").
         graphify 는 자기 CLI 로 스킬을 심으므로 `skills list -g` 에 안 뜬다.
         두 축을 다 요구하면 **정상 설치가 전건 '반쪽'으로 떨어진다.**
         축을 줄인 게 아니라, **이 스킬에는 그 축이 애초에 없다.** */
    id: "graphify",
    이름: "그래피파이",
    한줄: "코드베이스 전체를 지식그래프로 만들어, 뒤지는 대신 물어보게 한다",
    출처: "Graphify-Labs/graphify",
    만든곳: "Graphify Labs",
    라이선스: "Apache-2.0",
    설치기: "python",
    설치: [
      ["-m", "pip", "install", "--upgrade", "graphifyy"],
      ["-m", "graphify", "install", "--platform", "claude"],
    ],
    검증이름: "graphify",
    검증축: "파일",
    손으로: "pip install graphifyy && graphify install",
  },
];

/* ── 파이썬 찾기 ─────────────────────────────────────────────────────────
   ★이름을 믿지 않는다. **실제로 돌려 보고** 고른다.
     윈도우의 `python` 은 마이크로소프트 스토어 껍데기인 경우가 있고(실행하면 스토어가 열린다),
     같은 PC 에 파이썬이 둘 있으면 하나는 모듈이 텅 비어 있기도 하다(우리 PC 실측).
     그래서 후보를 순서대로 **`import pip` 까지 시켜 보고** 통과한 첫 놈을 쓴다. */
export const 파이썬후보 = () => (윈도우
  ? [["py", ["-3"]], ["python", []], ["python3", []]]
  : [["python3", []], ["python", []]]);

/* ★★셸을 쓰지 않는다. **여기서 한 번 크게 데었다**(2026-08-21).
     처음엔 `npx` 와 똑같이 `shell: 셸필요()` 를 줬는데, 윈도우에서는 그게 `cmd /c` 다.
     그러면 `-c "import pip,sys;print(...)"` 의 **세미콜론에서 cmd 가 잘라 버린다** —
     파이썬은 `-c import` 만 받고 죽고, 우리는 "파이썬을 찾지 못했습니다"를 본다.
     **파이썬이 멀쩡히 깔린 PC에서 그랬다.**
   → `python.exe`·`py.exe` 는 진짜 실행파일이라 셸이 애초에 필요 없다. 셸을 빼면
     따옴표 문제가 통째로 사라진다. 덤으로 인자에 **셸 특수문자를 아예 안 쓴다**(아래 시험이 지킨다). */
const 파이썬실행 = (cmd, args, timeout = 60000) =>
  spawnSync(cmd, args, { encoding: "utf8", timeout, windowsHide: true, shell: false, input: "" });

export function 파이썬찾기() {
  for (const [cmd, pre] of 파이썬후보()) {
    //: ① 진짜 파이썬 3 인가 (윈도우 `python3` 는 마이크로소프트 스토어 껍데기다 — 여기서 걸린다)
    const v = 파이썬실행(cmd, [...pre, "--version"]);
    if (v.status !== 0) continue;
    if (!/Python 3/.test(String(v.stdout || "") + String(v.stderr || ""))) continue;
    //: ② pip 이 있는가. 같은 PC 에 파이썬이 둘이면 하나는 텅 비어 있기도 하다(실측).
    if (파이썬실행(cmd, [...pre, "-c", "import pip"]).status !== 0) continue;
    return { cmd, pre };
  }
  return null;
}

/* ── 검증 ①: CLI 가 아는가 ──────────────────────────────────────────────
   `skills list -g` 를 한 번만 부르고 결과를 재사용한다. 스킬마다 부르면 5배 느리다. */
let _목록캐시 = null;
export function 설치목록(다시 = false) {
  if (_목록캐시 && !다시) return _목록캐시;
  const r = spawnSync(npx(), ["-y", "skills@latest", "list", "-g"], {
    encoding: "utf8", timeout: 180000, windowsHide: true, shell: 셸필요(),
  });
  const 원문 = String(r.stdout || "") + String(r.stderr || "");
  // ★색 코드를 걷어낸다. 안 걷으면 이름이 `\x1b[36magent-browser` 로 잡혀 전건 실패한다.
  const 깨끗 = 원문.replace(/\x1b\[[0-9;]*m/g, "");
  _목록캐시 = { ok: r.status === 0, 원문: 깨끗, 이름들: 이름뽑기(깨끗) };
  return _목록캐시;
}

/** 목록 출력에서 스킬 이름만 뽑는다. `이름   경로` 꼴의 줄에서 첫 칸. */
export function 이름뽑기(텍스트) {
  const out = [];
  for (const line of String(텍스트 || "").split(/\r?\n/)) {
    const m = /^(\S+)\s+([~/\\][^\s]*)/.exec(line.trim());
    if (m) out.push(m[1]);
  }
  return [...new Set(out)];
}

/* ── 검증 ②: 파일이 있는가 ─────────────────────────────────────────────── */
const 스킬폴더들 = [
  join(HOME, ".claude", "skills"),
  join(HOME, ".agents", "skills"),
];

/** 이 이름의 스킬이 파일로 존재하고 머리말이 온전한가. */
export function 파일로있나(이름) {
  for (const base of 스킬폴더들) {
    const p = join(base, 이름, "SKILL.md");
    if (!existsSync(p)) continue;
    let t = "";
    try { t = readFileSync(p, "utf8"); } catch { return { ok: false, 이유: "SKILL.md 를 읽지 못했다", 경로: p }; }
    // ★있다고 다 된 게 아니다. 머리말이 깨지면 클로드가 스킬로 못 읽는다.
    if (!/^---[\s\S]*?\bname\s*:/m.test(t)) return { ok: false, 이유: "SKILL.md 머리말에 name 이 없다", 경로: p };
    if (t.trim().length < 40) return { ok: false, 이유: "SKILL.md 가 사실상 비어 있다", 경로: p };
    return { ok: true, 경로: p };
  }
  return { ok: false, 이유: "SKILL.md 가 없다" };
}

/** 스킬 하나의 현재 상태. **두 축을 따로 재고, 어긋나면 어긋났다고 말한다.** */
export function 상태(s, 목록) {
  const 후보 = [s.검증이름, ...(s.검증대안 || [])];
  const cli = 후보.find((n) => 목록.이름들.includes(n)) || null;
  const 파일 = 후보.map((n) => ({ n, r: 파일로있나(n) })).find((x) => x.r.ok) || null;

  /* ★어떤 스킬은 **CLI 목록 축이 아예 없다**(자기 설치기로 심는 것 — graphify).
       두 축을 요구하면 정상 설치가 전건 '반쪽'으로 떨어진다.
       ★축을 줄이는 건 위험한 일이라 **스킬이 명시적으로 선언할 때만** 줄인다.
         기본값은 여전히 두 축이다 — 모르는 스킬을 슬쩍 봐주지 않는다. */
  if (s.검증축 === "파일") {
    return 파일
      ? { 등급: "완료", 설명: `파일 확인 (${파일.n})`, 경로: 파일.r.경로 }
      : { 등급: "없음", 설명: "설치되지 않았다" };
  }

  if (cli && 파일) return { 등급: "완료", 설명: `목록·파일 둘 다 확인 (${cli})`, 경로: 파일.r.경로 };
  if (!cli && !파일) return { 등급: "없음", 설명: "설치되지 않았다" };
  // ★한쪽만 있는 상태를 "됐다"고 하지 않는다. 이게 나중에 "왜 안 되지"가 되는 자리다.
  return {
    등급: "반쪽",
    설명: cli
      ? `목록에는 뜨는데 SKILL.md 를 못 찾았다 (${cli})`
      : `파일은 있는데 목록에 안 뜬다 (${파일.n})`,
    경로: 파일?.r?.경로,
  };
}

/* ── 실행 도구 ──────────────────────────────────────────────────────────── */
// ★윈도우에서 `npx` 는 `npx.CMD` 다. shell 없이 부르면 EINVAL 로 튄다.
const 윈도우 = process.platform === "win32";
const npx = () => "npx";
const 셸필요 = () => 윈도우;

function 돌리기(args, timeout = 600000) {
  return spawnSync(npx(), args, {
    encoding: "utf8", timeout, windowsHide: true, shell: 셸필요(),
    // ★설치기가 물어보면 stdin 이 없으니 바로 끝난다. 붙잡고 있지 않는다.
    input: "",
  });
}

/* ── 선행 조건 ─────────────────────────────────────────────────────────── */
/* ★`git명령` 을 인자로 받는다. 시험이 **git 이 깔린 PC 에서도** 「없을 때」를 재려면
   없는 상태를 실제로 만들 수 있어야 한다. 기본값은 진짜 명령이라 본 실행은 그대로다. */
export function 선행조건(git명령 = "git") {
  const 탈 = [];
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 18) 탈.push(`Node 가 ${process.versions.node} 입니다. 18 이상이 필요합니다 → https://nodejs.org`);
  const r = spawnSync(npx(), ["--version"], { encoding: "utf8", timeout: 60000, windowsHide: true, shell: 셸필요() });
  if (r.status !== 0) 탈.push("npx 를 실행하지 못했습니다. Node.js 를 다시 설치해 주세요.");
  /* ★★git 이 없으면 **한 종도 안 깔린다.** 속 도구 `skills` 가 simple-git 으로
       시스템 `git` 실행파일을 불러 레포를 clone 하기 때문이다.
       윈도우에는 git 이 기본으로 안 깔려 있다 — 드문 일이 아니라 **흔한 첫 실행**이다.
     ★여기서 안 막으면 빨간 「실패」만 줄줄이 내려가고 이유는 아무 데도 안 적힌다
       (2026-09-18 유료판에서 실제로 난 일. 48종이 전부 떨어졌다). */
  const g = spawnSync(git명령, ["--version"], { encoding: "utf8", timeout: 60000, windowsHide: true, shell: 셸필요() });
  if (g.status !== 0) {
    탈.push(
      "git 이 없습니다. 스킬을 내려받는 데 git 이 꼭 필요합니다 — 이것 없이는 한 종도 깔리지 않습니다.\n"
      + (process.platform === "win32"
        ? "    설치: 명령 프롬프트에 winget install --id Git.Git -e --source winget\n"
          + "    ★깐 뒤에는 이 검은 창을 닫고 새로 열어야 합니다. 열려 있던 창은 옛 환경을 그대로 들고 있습니다."
        : process.platform === "darwin"
          ? "    설치: xcode-select --install  (또는 brew install git)"
          : "    설치: sudo apt install git  (또는 각 배포판의 패키지 관리자)")
    );
  }
  if (!existsSync(join(HOME, ".claude"))) {
    // 없어도 설치는 되지만, 클로드 코드를 한 번도 안 켠 상태다 — 미리 말해 준다.
    탈.push("~/.claude 폴더가 없습니다. 클로드 코드를 한 번 실행한 뒤 다시 돌려 주세요.");
  }
  return 탈;
}

/* ── 자기시험 ──────────────────────────────────────────────────────────── */
if (자기시험) {
  const 시험 = [];
  const T = (n, ok) => 시험.push([n, !!ok]);

  const 샘플 = [
    "\x1b[1mGlobal Skills\x1b[0m",
    "",
    "\x1b[36magent-browser  \x1b[0m \x1b[38;5;102m~\\.claude\\skills\\agent-browser \x1b[0m",
    "  \x1b[38;5;102mAgents:\x1b[0m Claude Code  \x1b[38;5;102mSource:\x1b[0m vercel-labs/agent-browser",
    "\x1b[36mgraphify       \x1b[0m \x1b[38;5;102m~\\.claude\\skills\\graphify      \x1b[0m",
  ].join("\n");
  const 깨끗 = 샘플.replace(/\x1b\[[0-9;]*m/g, "");
  const 이름들 = 이름뽑기(깨끗);
  T("목록에서 이름을 뽑는다", 이름들.includes("agent-browser") && 이름들.includes("graphify"));
  T("★색 코드가 이름에 섞이지 않는다", !이름들.some((n) => n.includes("[")));
  T("★머리글(Global Skills)은 이름이 아니다", !이름들.includes("Global"));
  T("★'Agents:' 줄은 이름이 아니다", !이름들.includes("Agents:"));
  T("★색 코드를 안 걷으면 못 뽑는다(그래서 걷는다)", 이름뽑기(샘플).length < 이름들.length);

  T("★없는 스킬은 파일로도 없다", !파일로있나("이런건없다-" + Date.now()).ok);
  const 있는것 = readdirSync(join(HOME, ".claude", "skills")).find((d) =>
    existsSync(join(HOME, ".claude", "skills", d, "SKILL.md")));
  T("이미 있는 스킬은 파일로 잡힌다", !있는것 || 파일로있나(있는것).ok);

  /* ★시험이 **기계 상태에 기대면 안 된다.** 처음엔 `agent-browser` 로 이 시험을 썼는데,
     그걸 실제로 설치하자마자 파일이 생겨 '완료'가 되면서 시험이 깨졌다.
     디스크에 절대 없을 이름을 쓴다. */
  const 유령 = "절대없는스킬-" + Date.now();
  const 목록가짜 = { 이름들: [유령] };
  T("★목록에만 있고 파일이 없으면 '반쪽'", 상태({ 검증이름: 유령 }, 목록가짜).등급 === "반쪽");
  T("★둘 다 없으면 '없음'", 상태({ 검증이름: "절대없는스킬" }, { 이름들: [] }).등급 === "없음");

  T("스킬 6개가 정의돼 있다", 스킬들.length === 6);
  T("★전부 출처와 라이선스를 갖고 있다", 스킬들.every((s) => s.출처 && s.라이선스 && s.만든곳));
  T("★설치 명령이 전부 있다", 스킬들.every((s) => Array.isArray(s.설치) && s.설치.length));
  T("★벤더링하지 않는다(파일을 동봉하지 않는다)", 스킬들.every((s) => !s.파일복사));

  /* ── graphify(6번째) — 앞의 다섯과 **설치·검증이 둘 다 다르다.**
        다르다는 걸 시험으로 못 박아 둔다. 안 그러면 다음 사람이 "통일"하려다 깨뜨린다. ── */
  const gfy = 스킬들.find((x) => x.id === "graphify");
  T("★graphify 만 파이썬 설치기다", gfy.설치기 === "python" &&
    스킬들.filter((x) => x.설치기 === "python").length === 1);
  T("★graphify 설치는 명령 두 개(설치 → 심기)다",
    Array.isArray(gfy.설치[0]) && gfy.설치.length === 2);
  T("★`python -m` 으로 부른다(윈도우 PATH 문제를 비켜 간다)",
    gfy.설치.every((명) => 명[0] === "-m"));
  T("★PyPI 이름은 임시로 graphifyy 다(CLI 는 graphify)",
    gfy.설치[0].includes("graphifyy") && gfy.검증이름 === "graphify");
  T("★막혔을 때 손으로 돌릴 명령이 적혀 있다", typeof gfy.손으로 === "string" && gfy.손으로.length > 10);

  /* ★2026-08-21 실사고: 파이썬 탐지에 `shell:true` 를 줬다가 cmd 가 세미콜론에서 잘라
       **파이썬이 멀쩡히 깔린 PC에서 "파이썬을 찾지 못했습니다"** 가 나왔다.
       인자에 셸 특수문자가 없으면 셸 유무와 무관하게 안전하다 — 그걸 여기서 강제한다. */
  const 특수문자 = /[;&|<>^()"']/;
  T("★파이썬 설치 인자에 셸 특수문자가 없다",
    gfy.설치.every((명) => 명.every((a) => !특수문자.test(a))));
  T("★셸 특수문자 검사가 실제로 잡는다(뒤집어 확인)",
    특수문자.test("import pip,sys;print(1)"));
  T("★파이썬 후보에 윈도우 스토어 껍데기(python3)가 마지막이다",
    !윈도우 || 파이썬후보()[파이썬후보().length - 1][0] === "python3");

  /* ★검증축을 **양방향으로** 시험한다. 한 방향만 보면 "다 통과"가 곧 고장일 수 있다. */
  const 유령2 = "절대없는스킬2-" + Date.now();
  T("★검증축:'파일' 이면 목록에 없어도 완료로 본다(graphify 는 목록 축이 없다)",
    상태({ 검증이름: 있는것 || "graphify", 검증축: "파일" }, { 이름들: [] }).등급 !== "반쪽");
  T("★검증축:'파일' 이어도 파일이 없으면 '없음'이다(봐주지 않는다)",
    상태({ 검증이름: 유령2, 검증축: "파일" }, { 이름들: [유령2] }).등급 === "없음");
  T("★검증축을 선언 안 하면 여전히 두 축이다(기본값이 느슨해지지 않았다)",
    상태({ 검증이름: 유령2 }, { 이름들: [유령2] }).등급 === "반쪽");
  /* ★2026-08-19 실사고: GSD 검증 이름을 `get-shit-done` 으로 뒀다가 **성공을 실패로 보고**했다.
     GSD 는 그 이름의 스킬을 만들지 않는다. 같은 실수를 다시 하지 않게 여기서 잡는다. */
  const gsd = 스킬들.find((x) => x.id === "gsd");
  T("★GSD 검증 이름이 실제로 깔리는 것(gsd-*)이다", /^gsd-/.test(gsd.검증이름));
  T("★GSD 를 'get-shit-done' 으로 찾지 않는다",
    ![gsd.검증이름, ...(gsd.검증대안 || [])].includes("get-shit-done"));

  /* ★2026-08-24: "6개"라고 광고하고 76개를 깔고 있었다(실측: 스킬 90개 중 71개가 gsd-*).
     GSD 는 자기 설치기가 한 덩어리로 심어서 우리가 쪼갤 수 없다. 쪼갤 수 없으면
     **적어도 몇 개인지는 말해야 한다.** 그 문구가 사라지는 순간 다시 거짓말이 된다. */
  T("★GSD 는 덩어리라고 화면에 적는다", typeof gsd.덩어리 === "string" && gsd.덩어리.length > 10);
  T("★그 문구가 개수와 빼는 법을 둘 다 말한다",
    /\d/.test(gsd.덩어리 || "") && (gsd.덩어리 || "").includes("--skip"));
  //: 나머지 다섯은 --skill 로 하나씩 못 박혀 있어야 한다. 못 박히지 않은 게 새로 들어오면
  //  그건 또 다른 덩어리다 — 덩어리 고지 없이는 통과시키지 않는다.
  T("★덩어리 고지가 없는 항목은 전부 스킬 하나만 깐다", 스킬들.every((x) => {
    if (x.덩어리) return true;
    if (x.설치기 === "python") return true;              // graphify — 자기 CLI, 스킬 1개
    const 평평 = JSON.stringify(x.설치);
    return !평평.includes('"skills"') || 평평.includes('"--skill"');
  }));

  /* ★--skip 은 "뺐다고 생각했는데 깔렸다"를 막는 장치다. 파서가 조용히 죽으면 그 사고가 난다. */
  T("★--skip 이 하나를 뺀다", 건너뛰기파싱(["--skip", "gsd"]).join() === "gsd");
  T("★--skip 이 쉼표로 여러 개를 뺀다",
    건너뛰기파싱(["--skip", "gsd,taste"]).join() === "gsd,taste");
  T("★--skip 뒤에 값이 없으면 아무것도 빼지 않는다(조용히 전부 빼지 않는다)",
    건너뛰기파싱(["--skip", "--check"]).length === 0);
  T("★--skip 을 안 쓰면 빈 목록이다", 건너뛰기파싱(["--check"]).length === 0);

  /* ★안내 스킬은 **배송에서 빠지기 쉬운 물건**이다. package.json 의 files 에서 빠지면
     npm 으로 받은 사람에게는 파일이 아예 없고, 그래도 설치는 조용히 성공한다(에러가 안 난다).
     "왜 안내가 안 뜨지"를 몇 주 뒤에 알게 되는 종류라 여기서 막는다. */
  T("★안내스킬.md 가 옆에 있다", existsSync(join(여기, "안내스킬.md")));
  // ★자리표시자가 남아 있어야 심을 때 채워진다. 정본이 이걸 잃으면 고객 파일에
  //   `{{문들}}` 이 그대로 박힌 채 나간다 — 화면에 대놓고 보이는 사고다.
  T("★안내스킬.md 에 자리표시자가 있다", (() => {
    const f = join(여기, "안내스킬.md");
    if (!existsSync(f)) return false;
    const t = readFileSync(f, "utf8");
    return t.includes("{{문들}}") && t.includes("{{링크}}") && t.includes("reborn:문들:시작");
  })());
  T("★package.json files 에 안내스킬.md 가 들어 있다", (() => {
    const pj = join(여기, "package.json");
    if (!existsSync(pj)) return true;   // zip 배포본에는 package.json 이 없을 수도 있다
    return (JSON.parse(readFileSync(pj, "utf8")).files || []).includes("안내스킬.md");
  })());

  /* ★git 검사 (2026-09-18 유료판 사고 뒤 여기에도 넣었다).
     ★★없는 상태를 **실제로 만들어** 잰다. `git 있나 ? …` 로 가르면 git 이 깔린 PC 에서는
       검사를 통째로 죽여도 전건 초록이다 — 아무것도 안 재는 관문이 된다. */
  const git탈뽑기 = (명령) => 선행조건(명령).filter((t) => t.startsWith("git 이 없습니다"));
  T("★git 이 없으면 막는다", git탈뽑기("gitzzz-없는명령").length === 1);
  T("★git 이 있으면 안 막는다", git탈뽑기("git").length === 0);
  T("★안내에 설치 명령이 들어 있다",
    /winget|brew|apt|xcode-select/.test(git탈뽑기("gitzzz-없는명령")[0] || ""));

  const 실패 = 시험.filter(([, ok]) => !ok);
  for (const [n, ok] of 시험) console.log(`  ${ok ? c.g + "✓" : c.r + "✗"}${c[0]} ${n}`);
  if (실패.length) { console.error(`\n${c.r}✗ 자기시험 ${실패.length}건 실패${c[0]}`); process.exit(1); }
  console.log(`\n${c.g}✓ 자기시험 ${시험.length}건 통과${c[0]}`);
  process.exit(0);
}

/* ── 본 실행 ───────────────────────────────────────────────────────────── */
console.log(`\n${c.b}클로드 코드 필수 스킬 6개${c[0]} ${c.d}— 설치하고, 진짜 되는지 확인합니다${c[0]}\n`);
/* ★한 줄로 총량을 먼저 밝힌다. 요약에만 두면 이미 다 깔린 뒤에 읽게 된다. */
{
  const 덩어리들 = 스킬들.filter((s) => s.덩어리 && !건너뛴다.includes(s.id));
  if (덩어리들.length)
    console.log(`${c.y}※ 이 중 ${덩어리들.map((s) => s.이름).join("·")} 은 스킬 폴더를 여러 개 만듭니다 — 아래에 개수를 적었습니다.${c[0]}`);
}
console.log("");

const 막힌것 = 선행조건();
if (막힌것.length) {
  console.log(`${c.r}먼저 이것부터 해결해 주세요${c[0]}`);
  for (const m of 막힌것) console.log(`  · ${m}`);
  console.log("");
  process.exit(2);
}

const 없는이름 = 건너뛴다.filter((id) => !스킬들.some((s) => s.id === id));
if (없는이름.length) {
  //: 오타를 조용히 무시하면 "뺐다고 생각했는데 깔렸다"가 된다. 그게 제일 나쁘다.
  console.error(`${c.r}✗ --skip 에 그런 이름이 없습니다: ${없는이름.join(", ")}${c[0]}`);
  console.error(`${c.d}  쓸 수 있는 이름: ${스킬들.map((s) => s.id).join(" · ")}${c[0]}
`);
  process.exit(2);
}
const 대상 = (하나만 ? 스킬들.filter((s) => s.id === 하나만) : 스킬들)
  .filter((s) => !건너뛴다.includes(s.id));
if (!대상.length) { console.error(`${c.r}✗ 깔 것이 없습니다${하나만 ? `: ${하나만}` : ""}${c[0]}`); process.exit(2); }
if (건너뛴다.length)
  console.log(`${c.d}건너뜁니다 — ${스킬들.filter((s) => 건너뛴다.includes(s.id)).map((s) => s.이름).join(" · ")}${c[0]}`);

console.log(`${c.d}지금 상태를 봅니다…${c[0]}`);
let 목록 = 설치목록();
const 결과 = [];

for (const [i, s] of 대상.entries()) {
  const 번호 = `[${i + 1}/${대상.length}]`;
  const 전 = 상태(s, 목록);

  console.log(`\n${c.cy}${번호} ${s.이름}${c[0]}  ${c.d}${s.한줄}${c[0]}`);
  console.log(`      ${c.d}출처 ${s.출처} · ${s.만든곳} · ${s.라이선스}${c[0]}`);
  if (s.덩어리) console.log(`      ${c.y}※ ${s.덩어리}${c[0]}`);
  if (s.주의) console.log(`      ${c.y}⚠ ${s.주의}${c[0]}`);

  if (전.등급 === "완료") {
    // ★이미 있으면 다시 깔지 않는다. 다시 깔아서 얻는 게 없고, 잃을 건 있다.
    console.log(`      ${c.g}✓ 이미 설치돼 있습니다${c[0]} ${c.d}(${전.설명})${c[0]}`);
    결과.push({ s, 등급: "이미", 설명: 전.설명 });
    continue;
  }

  if (확인만) {
    console.log(`      ${전.등급 === "없음" ? c.y + "· 설치 필요" : c.r + "✗ " + 전.설명}${c[0]}`);
    결과.push({ s, 등급: 전.등급 === "없음" ? "필요" : "반쪽", 설명: 전.설명 });
    continue;
  }

  console.log(`      ${c.d}설치 중…${c[0]}`);
  let r;
  if (s.설치기 === "python") {
    /* ★파이썬 갈래. 명령이 **둘**이다(패키지 설치 → 스킬 심기). 앞이 실패하면 뒤를 돌리지 않는다 —
       실패한 뒤에 심기를 시도하면 엉뚱한 에러가 나서 원인을 가린다. */
    const py = 파이썬찾기();
    if (!py) {
      console.log(`      ${c.r}✗ 파이썬을 찾지 못했습니다${c[0]}`);
      결과.push({ s, 등급: "실패",
        설명: "파이썬 3 이 필요합니다 → https://python.org (윈도우는 설치 시 'Add to PATH' 체크)" });
      continue;
    }
    for (const 명 of s.설치) {
      r = 파이썬실행(py.cmd, [...py.pre, ...명], 900000);   //: 셸 없이 — 위 주석 참조
      if (r.status !== 0) break;
    }
  } else {
    r = 돌리기(["-y", ...s.설치]);
  }

  /* ★★종료코드로 판정하지 않는다. 끝났으면 **다시 물어본다.** */
  목록 = 설치목록(true);
  const 후 = 상태(s, 목록);

  if (후.등급 === "완료") {
    console.log(`      ${c.g}✓ 설치됨 · 동작 확인${c[0]} ${c.d}(${후.설명})${c[0]}`);
    결과.push({ s, 등급: "설치", 설명: 후.설명 });
  } else if (후.등급 === "반쪽") {
    console.log(`      ${c.y}△ 반쯤 붙었습니다 — ${후.설명}${c[0]}`);
    결과.push({ s, 등급: "반쪽", 설명: 후.설명, 로그: 꼬리(r) });
  } else {
    console.log(`      ${c.r}✗ 확인되지 않았습니다${c[0]}`);
    결과.push({ s, 등급: "실패",
      설명: "설치 후에도 목록·파일 어디에도 잡히지 않았습니다.", 로그: 꼬리(r) });
  }
}


/* ── ⑥ 20만 스타 규칙 파일 — 프로젝트에 넣는다 ───────────────────────────
   ★앞의 여섯은 **전역 스킬**(~/.claude/skills)이다. 이건 성격이 다르다 —
     **지금 폴더의 CLAUDE.md** 다. 클로드 코드가 세션마다 자동으로 읽는 파일이라,
     "AI 한테 뭘 하라고 시키는" 대신 "뭘 하지 말아야 할지"를 미리 깔아 두는 것이다.

   ★출처를 화면에 적는다. 우리가 만든 게 아니다.
     multica-ai/andrej-karpathy-skills — 별 20만 개. Andrej Karpathy 의
     LLM 코딩 함정 관찰을 Forrest Chang 이 CLAUDE.md 한 장으로 정리한 것.

   ★★**라이선스 표기가 없다.** 그래서 이 파일을 **동봉하지 않는다.**
     설치할 때 원저작자 저장소에서 **직접 받는다.** 재배포가 아니라 대신 받아 주는 것이다.
     (여섯 개 스킬에 쓰는 방침과 같다 — 공식 경로를 부를 뿐 파일을 싣지 않는다)

   ★덮어쓰지 않는다. 이미 CLAUDE.md 가 있으면 **뒤에 덧붙인다.**
     원저작자 README 가 안내하는 방식(curl ... >> CLAUDE.md)과 같고, 남의 규칙을 지우지 않는다.
     이미 들어 있으면 아무것도 하지 않는다. */
const 규칙 = {
  이름: "카파시 규칙 (CLAUDE.md)",
  출처: "multica-ai/andrej-karpathy-skills",
  만든곳: "Forrest Chang · Andrej Karpathy 의 LLM 코딩 함정 관찰 기반",
  라이선스: "라이선스 표기 없음 — 그래서 동봉하지 않고 원본에서 직접 받습니다",
  주소: "https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/main/CLAUDE.md",
  표시: "https://github.com/multica-ai/andrej-karpathy-skills",
  손으로: "curl https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md",
  표식: "Behavioral guidelines to reduce common LLM coding mistakes",
};

const 규칙건너뛰기 = 인자.includes("--skip-rules");

async function 규칙깔기() {
  if (규칙건너뛰기) return { 등급: "생략", 설명: "--skip-rules 로 건너뛰었습니다" };

  const 여기폴더 = process.cwd();
  //: 홈 폴더에 CLAUDE.md 를 만들면 모든 프로젝트에 딸려 들어간다. 그건 사용자가 원한 게 아니다.
  if (여기폴더 === HOME) {
    return { 등급: "생략", 설명: "지금 위치가 홈 폴더입니다. 프로젝트 폴더에서 다시 돌리세요",
      손으로: 규칙.손으로 };
  }

  const 파일 = join(여기폴더, "CLAUDE.md");
  const 있던것 = existsSync(파일) ? readFileSync(파일, "utf8") : null;

  if (있던것 && 있던것.includes(규칙.표식)) {
    return { 등급: "이미", 설명: "이미 들어 있습니다 (" + 파일 + ")" };
  }
  if (확인만) {
    return { 등급: "필요",
      설명: 있던것 ? "CLAUDE.md 는 있는데 규칙은 아직 없습니다" : "CLAUDE.md 가 아직 없습니다" };
  }

  let 본문;
  try {
    본문 = await 받아오기(규칙.주소);
  } catch (e) {
    return { 등급: "실패", 설명: "원본을 못 받았습니다 (" + String(e.message || e).slice(0, 60) + ")",
      손으로: 규칙.손으로 };
  }

  //: 받아온 게 진짜 그 파일인지 본다. 404 페이지를 저장하면 조용한 실패가 된다.
  if (!본문.includes(규칙.표식)) {
    return { 등급: "실패", 설명: "받아온 내용이 그 파일이 아닙니다", 손으로: 규칙.손으로 };
  }

  const 머리 =
    "\n\n<!-- ─────────────────────────────────────────────────────────────\n" +
    "  아래는 " + 규칙.출처 + " 의 CLAUDE.md 입니다 (별 20만 개).\n" +
    "  " + 규칙.만든곳 + "\n" +
    "  " + 규칙.표시 + "\n" +
    "  리본랩스 설치기(npx --yes reborn-skills)가 원본에서 받아 붙였습니다. 필요 없으면 이 아래를 지우세요.\n" +
    "───────────────────────────────────────────────────────────── -->\n\n";

  try {
    writeFileSync(파일, (있던것 ? 있던것.replace(/\s*$/, "") : "") + 머리 + 본문, "utf8");
  } catch (e) {
    return { 등급: "실패", 설명: "쓰지 못했습니다 (" + String(e.message || e).slice(0, 60) + ")",
      손으로: 규칙.손으로 };
  }

  //: 쓴 다음 **다시 읽어서** 확인한다. 쓰기 성공이 곧 들어간 것은 아니다.
  const 확인 = existsSync(파일) ? readFileSync(파일, "utf8") : "";
  if (!확인.includes(규칙.표식)) {
    return { 등급: "실패", 설명: "썼는데 다시 읽으니 없습니다", 손으로: 규칙.손으로 };
  }
  return { 등급: "설치",
    설명: 있던것 ? "기존 CLAUDE.md 뒤에 덧붙였습니다" : "새로 만들었습니다 (" + 파일 + ")" };
}

/** 한 파일 받아오기 — **`fetch` 를 쓰지 않는다.**
 *  ★윈도우에서 `fetch`(undici)가 남긴 연결이 spawnSync 핸들과 겹치면, 프로세스가 끝나는 순간
 *    `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` 가 **마지막 줄로** 찍힌다.
 *    일은 다 끝났고 종료코드도 0 인데, 고객 눈에는 설치가 실패한 것으로 보인다(2026-08-21 실측).
 *    `fetch` 만 돌리면 안 나고, spawnSync 와 같이 돌 때만 난다 — 그래서 **연결 주인을 바꾼다.**
 *  ★`node:https` 는 undici 를 안 탄다. 리다이렉트만 손으로 따라가면 된다(깃허브 raw 는 1~2회). */
function 받아오기(주소, 남은 = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(주소, { headers: { "user-agent": "reborn-skills", connection: "close" } }, (res) => {
      const code = res.statusCode || 0;
      if (code >= 300 && code < 400 && res.headers.location) {
        res.resume();
        if (남은 <= 0) return reject(new Error("리다이렉트가 너무 많습니다"));
        return resolve(받아오기(new URL(res.headers.location, 주소).href, 남은 - 1));
      }
      if (code !== 200) { res.resume(); return reject(new Error("HTTP " + code)); }
      let buf = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { buf += c; });
      res.on("end", () => resolve(buf));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(new Error("시간 초과")); });
  });
}

/* ── 요약 ─────────────────────────────────────────────────────────────── */
const 센다 = (g) => 결과.filter((x) => x.등급 === g).length;
const 된것 = 센다("설치") + 센다("이미");
console.log(`\n${"─".repeat(58)}`);
for (const x of 결과) {
  const mark = { 설치: c.g + "✓", 이미: c.g + "✓", 필요: c.y + "·", 반쪽: c.y + "△", 실패: c.r + "✗" }[x.등급];
  console.log(`  ${mark}${c[0]} ${x.s.이름.padEnd(20)} ${c.d}${x.설명}${c[0]}`);
  if (x.s.덩어리) console.log(`    ${c.y}※ ${x.s.덩어리}${c[0]}`);
}
for (const s of 스킬들.filter((s) => 건너뛴다.includes(s.id)))
  console.log(`  ${c.d}- ${s.이름.padEnd(20)} --skip 으로 건너뛰었습니다${c[0]}`);

/* ⑦ 규칙 파일 — 여섯 개와 나란히 한 줄로 보고한다 */
const 규칙결과 = await 규칙깔기();
{
  const mark = { 설치: c.g + "✓", 이미: c.g + "✓", 필요: c.y + "·",
                 생략: c.d + "-", 실패: c.r + "✗" }[규칙결과.등급] || (c.d + "-");
  console.log(`  ${mark}${c[0]} ${규칙.이름.padEnd(20)} ${c.d}${규칙결과.설명}${c[0]}`);
  console.log(`    ${c.d}출처 ${규칙.출처} · 별 20만 · ${규칙.만든곳}${c[0]}`);
  console.log(`    ${c.d}${규칙.라이선스}${c[0]}`);
  if (규칙결과.손으로) console.log(`    ${c.cy}직접 돌릴 명령:${c[0]}  ${규칙결과.손으로}`);
}

if (확인만) {
  console.log(`\n${c.d}확인만 했습니다. 설치하려면 옵션 없이 다시 돌리세요.${c[0]}\n`);
  process.exit(0);
}

console.log(`\n${된것 === 대상.length ? c.g : c.y}${된것}/${대상.length} 동작 확인됨${c[0]}`);

/* ★막힌 것은 **이유를 그대로** 보여준다. 요약하면 다음 사람이 다시 돌려봐야 한다. */
const 막힘 = 결과.filter((x) => x.등급 === "실패" || x.등급 === "반쪽");
if (막힘.length) {
  console.log(`\n${c.y}손이 필요한 것${c[0]}`);
  for (const x of 막힘) {
    console.log(`\n  ${c.b}${x.s.이름}${c[0]} — ${x.설명}`);
    if (x.s.손으로) console.log(`  ${c.cy}직접 돌릴 명령:${c[0]}  ${x.s.손으로}`);
    if (x.로그) {
      console.log(`  ${c.d}설치기가 마지막에 한 말:${c[0]}`);
      for (const line of String(x.로그).split(/\r?\n/).slice(-8)) console.log(`    ${c.d}${line}${c[0]}`);
    }
  }
}

console.log(`\n${c.d}스킬은 클로드 코드를 **다시 켜면** 잡힙니다. 이미 켜 두셨다면 한 번 껐다 켜 주세요.${c[0]}`);
/* ── 안내 스킬 심기 ─────────────────────────────────────────────────────
   ★[안내스킬심기] 이 블록은 **세 설치기에 똑같이** 들어간다.
     정본은 `claudekit/안내스킬_심기_정본.js` 이고, `node scripts/sync_guide_skill.mjs`
     가 세 곳에 밀어 넣는다. `--check` 로 셋이 같은지 본다. 손으로 고치지 말 것.

   ★왜 터미널 한 줄로 안 끝내나
     터미널 글자는 스크롤과 함께 사라진다. 고객이 "그래서 이걸로 뭘 돌리지"에
     부딪히는 건 **설치한 날이 아니라 며칠 뒤**다. 그때 그 자리에 있어야 한다.

   ★스킬로 넣는다(전역 CLAUDE.md 가 아니라)
     · 전역 CLAUDE.md 는 **고객이 자기 지침을 적어 둔 파일**이다. 남의 파일에 끼어들면
       매 대화 토큰을 먹고, 재설치 때 중복되고, 발견됐을 때 반발이 가장 크다.
     · 스킬은 고객이 **자동화를 실제로 물어본 그 순간에만** 뜬다. 좁지만 그게 더 팔린다.
       "매번 광고가 뜬다"가 되면 같이 깐 것까지 통째로 지워진다.

   ★알리지 않고 심되 **숨기지는 않는다.** 폴더 이름에 출처가 있고, 파일 첫머리에
     누가 넣었는지와 지우는 법이 적혀 있다. 열어본 사람에게 감춘 게 없어야 한다.

   ★★세 설치기가 **같은 파일**에 쓴다. 그냥 덮으면 먼저 들어온 문이 사라진다 —
     도구 5종으로 들어온 고객이 나중에 스킬 5개를 깔면 앞의 것이 없던 일이 된다.
     그러면 안내가 고객이 가진 것과 어긋나고, 어긋난 안내는 신뢰를 깎는다.
     그래서 기존 파일에서 문 목록을 읽어 **합친다.**

   ★아무것도 못 깔았으면 심지 않는다(부르는 쪽에서 막는다). 자기 일도 못 한 도구가
     남긴 판촉 파일은 그 순간부터 쓰레기다. */
function 안내스킬심기(문) {
  const 원본 = join(여기, "안내스킬.md");
  if (!existsSync(원본)) return false;   // 누가 빼고 배포했어도 설치는 굴러가야 한다
  try {
    const 폴더 = join(HOME, ".claude", "skills", "reborn-claudekit");
    const 파일 = join(폴더, "SKILL.md");
    const 기존 = existsSync(파일) ? readFileSync(파일, "utf8") : "";

    /* ★★구매자 판이 이미 있으면 **건드리지 않는다.** (2026-08-24 계단 ②)
       스킬팩을 산 사람의 안내는 클로드킷을 가리키는 다음 칸이다. 여기서 덮으면
       **이미 산 스킬팩을 다시 권하는 화면으로 되돌아간다** — 그 순간 신뢰가 깎이고,
       같이 깐 48종까지 통째로 지워진다. 계단은 내려가지 않는다.
       ★이번 문(門)을 못 적는 손해는 있지만, 되파는 사고보다 훨씬 싸다. */
    if (기존.includes("reborn:구매자판:스킬팩")) return true;

    const 문들 = [];
    const m = 기존.match(/<!-- reborn:문들:시작 -->([^]*?)<!-- reborn:문들:끝 -->/);
    if (m) for (const 줄 of m[1].trim().split(/\n(?=- )/)) if (줄.trim()) 문들.push(줄.trim());

    const 명령 = (줄) => (줄.match(/npx ([a-z0-9-]+)/) || [])[1];
    if (!문들.some((줄) => 명령(줄) === 문.명령)) 문들.push(문.줄);

    // 어느 문으로 들어왔는지 링크에 싣는다. 여럿이면 여럿 다 — 나중 것만 남기면
    // "스킬로 들어와 도구까지 깐 사람"이라는 사실이 사라진다.
    const 문표 = 문들.map(명령).filter(Boolean).sort().join("_") || "unknown";
    const 링크 = "https://rebornlabs.kr/claudekit?utm_source=skill&utm_medium=claude" +
      "&utm_campaign=guide-skill&utm_content=" + 문표;

    /* ★스킬팩(8,900원) 링크. 클로드킷(158,000원)보다 **먼저** 닿아야 한다 —
       무료 다음 칸이 곧바로 158,000원이라 아무도 못 건넜다(실측: 판매 페이지까지 간 10명 중 0명).
       같은 문표를 실어 **어느 무료 미끼에서 온 사람인지** 함께 센다. */
    const 스킬팩링크 = "https://rebornlabs.kr/skillpack?utm_source=skill&utm_medium=claude" +
      "&utm_campaign=guide-skill&utm_content=" + 문표;

    const 본문 = readFileSync(원본, "utf8")
      .replace("{{문들}}", 문들.join("\n"))
      .replace("{{스킬팩링크}}", 스킬팩링크)
      .replace("{{링크}}", 링크);

    mkdirSync(폴더, { recursive: true });
    writeFileSync(파일, 본문, "utf8");
    return true;
  } catch {
    // 권한이 없거나 홈을 못 찾는 환경이 있다. **설치를 실패로 만들지 않는다** —
    // 제 일을 하는 게 이 도구의 몫이고 이건 덤이다.
    return false;
  }
}
/* ── 안내 스킬 심기 끝 ─────────────────────────────────────────────────── */

/**
 * 클로드킷 한 칸.
 *
 * ★규칙 셋. 어기면 무료 설치기가 광고물이 되고, 그러면 이 퍼널이 파는
 *   신뢰(깔아 주고 되는지까지 본다)를 스스로 깎는다.
 *   ① **끝난 뒤 딱 한 칸.** 중간에 끼우지 않는다.
 *   ② **아무것도 못 깔았으면 안 띄운다.** 자기 일도 못 한 도구가 제품을 권하면
 *      그때부터는 안내가 아니라 광고로만 읽힌다.
 *   ③ **화면 한 칸은 파일을 남기지 않는다.** 지나가는 글자일 뿐이다.
 *      파일로 남는 건 안내 스킬 하나뿐이고(`~/.claude/skills/reborn-claudekit`),
 *      그건 폴더 이름에 출처가 있고 첫머리에 지우는 법이 적혀 있다.
 *      **알리지 않고 심되 숨기지는 않는다** — 열어본 사람에게 감춘 게 없어야 한다.
 */
if (된것 > 0) {
  안내스킬심기({
    명령: "reborn-skills",
    줄: "- **스킬 6개** (`npx --yes reborn-skills`) — agent-browser · find-skills · GSD · design-taste-frontend · mcp-builder · **graphify**.\n  브라우저 조작 · 스킬 탐색 · 작업 분해 · 디자인 · MCP 연결 · **코드베이스 지식그래프**.",
  });
  /* ★★가리키는 곳을 158,000원 → 8,900원으로 내렸다 (2026-08-24).
       실측: 무료를 받고 판매 페이지까지 간 사람 10명 중 주문 0명.
       관심이 없었던 게 아니라 무료(0원) 다음 칸이 곧바로 158,000원이라 못 건넌 것이다.
       자비스는 스킬팩을 산 사람에게 민다(결제완료 화면·메일). 그래야 계단이 생긴다.
     ★첫 줄은 방금 한 일에서 이어져야 한다. "저희 다른 제품도 있어요"는 광고고,
       "방금 하신 그 일의 다음 칸입니다"는 안내다. 그래서 설치기마다 첫 줄이 다르다.
     ★마지막 줄이 이 한 칸을 광고가 아니게 만든다 — 목록도 설치 명령도 다 공개돼 있다.
     ★문안 정본은 skillpack/tail_copy.mjs 다. */
  const 팩 = "https://rebornlabs.kr/skillpack?utm_source=installer&utm_medium=cli&utm_campaign=skill5";
  console.log(`${c.d}${"─".repeat(58)}${c[0]}`);
  console.log(`${c.d}방금 여섯 개를 골라 드렸습니다. 고르는 게 일의 절반입니다 —${c[0]}`);
  console.log(`${c.d}추천 목록을 그대로 다 깔면 스킬이 182개가 되고, 그 설명이 대화마다 실립니다.${c[0]}`);
  console.log(`
${c.b}리본랩스 스킬팩${c[0]}${c.d} — 같은 방식으로 고른 48종을 한 줄로. 8,900원${c[0]}`);
  console.log(`${c.cy}${팩}${c[0]}`);
  console.log(`${c.d}목록과 직접 까는 명령까지 그 페이지에 그대로 적어 두었습니다. 안 사셔도 됩니다.${c[0]}`);
}

console.log(`${c.d}막히시면 화면을 그대로 캡처해 보내 주세요 — https://mobility.rebornlabs.kr/cs${c[0]}\n`);

function 꼬리(r) {
  return String((r && (r.stdout || "")) + (r && (r.stderr || ""))).trim().slice(-1200);
}

process.exit(막힘.length ? 1 : 0);
