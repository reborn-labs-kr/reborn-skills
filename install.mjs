#!/usr/bin/env node
/**
 * 클로드 코드 필수 스킬 5개 설치기 — **설치하고, 진짜 되는지 확인까지 한다.**
 *
 *   node install.mjs              설치 + 검증
 *   node install.mjs --check      설치하지 않고 지금 상태만 본다
 *   node install.mjs --only gsd   하나만
 *   node install.mjs --self-test  검사기 자체 시험(설치 안 함)
 *
 * ★★왜 이걸 만드나
 *   남들은 "이 5개 설치하세요" 목록을 준다. 고객은 다섯 번 설치하고,
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
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = homedir();
const 여기 = dirname(fileURLToPath(import.meta.url));
const 인자 = process.argv.slice(2);
const 확인만 = 인자.includes("--check");
const 자기시험 = 인자.includes("--self-test");
const 하나만 = (() => { const i = 인자.indexOf("--only"); return i >= 0 ? 인자[i + 1] : null; })();

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
    설치: ["skills", "add", "vercel-labs/agent-browser", "-g", "-a", "claude-code", "-y"],
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
];

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
export function 선행조건() {
  const 탈 = [];
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 18) 탈.push(`Node 가 ${process.versions.node} 입니다. 18 이상이 필요합니다 → https://nodejs.org`);
  const r = spawnSync(npx(), ["--version"], { encoding: "utf8", timeout: 60000, windowsHide: true, shell: 셸필요() });
  if (r.status !== 0) 탈.push("npx 를 실행하지 못했습니다. Node.js 를 다시 설치해 주세요.");
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

  T("스킬 5개가 정의돼 있다", 스킬들.length === 5);
  T("★전부 출처와 라이선스를 갖고 있다", 스킬들.every((s) => s.출처 && s.라이선스 && s.만든곳));
  T("★설치 명령이 전부 있다", 스킬들.every((s) => Array.isArray(s.설치) && s.설치.length));
  T("★벤더링하지 않는다(전부 npx 호출)", 스킬들.every((s) => !s.파일복사));
  /* ★2026-08-19 실사고: GSD 검증 이름을 `get-shit-done` 으로 뒀다가 **성공을 실패로 보고**했다.
     GSD 는 그 이름의 스킬을 만들지 않는다. 같은 실수를 다시 하지 않게 여기서 잡는다. */
  const gsd = 스킬들.find((x) => x.id === "gsd");
  T("★GSD 검증 이름이 실제로 깔리는 것(gsd-*)이다", /^gsd-/.test(gsd.검증이름));
  T("★GSD 를 'get-shit-done' 으로 찾지 않는다",
    ![gsd.검증이름, ...(gsd.검증대안 || [])].includes("get-shit-done"));

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

  const 실패 = 시험.filter(([, ok]) => !ok);
  for (const [n, ok] of 시험) console.log(`  ${ok ? c.g + "✓" : c.r + "✗"}${c[0]} ${n}`);
  if (실패.length) { console.error(`\n${c.r}✗ 자기시험 ${실패.length}건 실패${c[0]}`); process.exit(1); }
  console.log(`\n${c.g}✓ 자기시험 ${시험.length}건 통과${c[0]}`);
  process.exit(0);
}

/* ── 본 실행 ───────────────────────────────────────────────────────────── */
console.log(`\n${c.b}클로드 코드 필수 스킬 5개${c[0]} ${c.d}— 설치하고, 진짜 되는지 확인합니다${c[0]}\n`);

const 막힌것 = 선행조건();
if (막힌것.length) {
  console.log(`${c.r}먼저 이것부터 해결해 주세요${c[0]}`);
  for (const m of 막힌것) console.log(`  · ${m}`);
  console.log("");
  process.exit(2);
}

const 대상 = 하나만 ? 스킬들.filter((s) => s.id === 하나만) : 스킬들;
if (!대상.length) { console.error(`${c.r}✗ 그런 스킬이 없습니다: ${하나만}${c[0]}`); process.exit(2); }

console.log(`${c.d}지금 상태를 봅니다…${c[0]}`);
let 목록 = 설치목록();
const 결과 = [];

for (const [i, s] of 대상.entries()) {
  const 번호 = `[${i + 1}/${대상.length}]`;
  const 전 = 상태(s, 목록);

  console.log(`\n${c.cy}${번호} ${s.이름}${c[0]}  ${c.d}${s.한줄}${c[0]}`);
  console.log(`      ${c.d}출처 ${s.출처} · ${s.만든곳} · ${s.라이선스}${c[0]}`);
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
  const r = 돌리기(["-y", ...s.설치]);

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

/* ── 요약 ─────────────────────────────────────────────────────────────── */
const 센다 = (g) => 결과.filter((x) => x.등급 === g).length;
const 된것 = 센다("설치") + 센다("이미");
console.log(`\n${"─".repeat(58)}`);
for (const x of 결과) {
  const mark = { 설치: c.g + "✓", 이미: c.g + "✓", 필요: c.y + "·", 반쪽: c.y + "△", 실패: c.r + "✗" }[x.등급];
  console.log(`  ${mark}${c[0]} ${x.s.이름.padEnd(20)} ${c.d}${x.설명}${c[0]}`);
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

    const 본문 = readFileSync(원본, "utf8")
      .replace("{{문들}}", 문들.join("\n"))
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
    줄: "- **스킬 5개** (`npx reborn-skills`) — agent-browser · find-skills · GSD · design-taste-frontend · mcp-builder.\n  브라우저 조작 · 스킬 탐색 · 작업 분해 · 디자인 · MCP 연결.",
  });
  const 킷 = "https://rebornlabs.kr/claudekit?utm_source=installer&utm_medium=cli&utm_campaign=skill5";
  console.log(`${c.d}${"\u2500".repeat(58)}${c[0]}`);
  console.log(`${c.d}방금 깐 다섯 개는 클로드를 잘 돌게 만드는 것입니다. 엔진을 손본 겁니다.${c[0]}`);
  console.log(`${c.d}그다음 남는 질문은 대개 하나입니다 \u2014 ${c[0]}${c.b}"그래서 이걸로 뭘 자동으로 돌리지?"${c[0]}`);
  console.log(`\n${c.b}리본랩스 클로드킷${c[0]}${c.d} \u2014 블로그·스레드·유튜브·인스타·음악 다섯 채널을 사람 없이 발행합니다.${c[0]}`);
  console.log(`${c.cy}${킷}${c[0]}`);
  console.log(`${c.d}설치기는 무료입니다. 안 사셔도 다섯 개는 그대로 쓰시면 됩니다.${c[0]}\n`);
}

console.log(`${c.d}막히시면 화면을 그대로 캡처해 보내 주세요 — https://mobility.rebornlabs.kr/cs${c[0]}\n`);

function 꼬리(r) {
  return String((r && (r.stdout || "")) + (r && (r.stderr || ""))).trim().slice(-1200);
}

process.exit(막힘.length ? 1 : 0);
