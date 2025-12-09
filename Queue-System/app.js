// app.js

// --- Queue Logic (비즈니스 로직) --------------------------

// 티켓 객체 예시:
// { id: 1, label: "G001", service: "GENERAL" }

class QueueManager {
  constructor() {
    this._tickets = [];
    this._lastId = 0;
    this._currentTicket = null;
    this._recentCalls = [];
  }

  get waitingCount() {
    return this._tickets.length;
  }

  get currentTicket() {
    return this._currentTicket;
  }

  get recentCalls() {
    return this._recentCalls;
  }

  issueTicket(service) {
    this._lastId += 1;

    const prefix = this._servicePrefix(service);
    const label = `${prefix}${String(this._lastId).padStart(3, "0")}`;

    const ticket = {
      id: this._lastId,
      label,
      service,
    };

    this._tickets.push(ticket);
    return ticket;
  }

  callNext() {
    if (this._tickets.length === 0) return null;

    const next = this._tickets.shift();
    this._currentTicket = next;

    // 최근 호출 내역에 추가 (최대 5개 유지)
    this._recentCalls.unshift({
      label: next.label,
      service: next.service,
      calledAt: new Date(),
    });
    this._recentCalls = this._recentCalls.slice(0, 5);

    return next;
  }

  recallCurrent() {
    // 실제로는 전광판에서 "다시 안내" 같은 동작을 할 수 있지만
    // 여기서는 그냥 현재 티켓을 반환만 한다.
    return this._currentTicket;
  }

  finishCurrent() {
    const done = this._currentTicket;
    this._currentTicket = null;
    return done;
  }

  _servicePrefix(service) {
    switch (service) {
      case "GENERAL":
        return "G";
      case "PAYMENTS":
        return "P";
      case "CONSULTATION":
        return "C";
      default:
        return "X";
    }
  }
}

// --- UI 연결 (DOM 조작) ---------------------------------

// 1) QueueManager 인스턴스 생성
const queue = new QueueManager();

// 2) DOM 요소 캐싱
const ticketOutputEl = document.getElementById("ticket-output");
const waitingCountEl = document.getElementById("waiting-count");
const currentTicketEl = document.getElementById("current-ticket");
const currentCounterEl = document.getElementById("current-counter");
const recentCallsEl = document.getElementById("recent-calls");
const operatorCurrentTicketEl = document.getElementById("operator-current-ticket");
const operatorCurrentServiceEl = document.getElementById("operator-current-service");
const counterSelectEl = document.getElementById("counter-select");

const btnNext = document.getElementById("btn-next");
const btnRecall = document.getElementById("btn-recall");
const btnFinish = document.getElementById("btn-finish");
const serviceButtons = document.querySelectorAll(".service-btn");

// 3) 헬퍼 – 화면 갱신 함수
function updateWaitingCount() {
  waitingCountEl.textContent = queue.waitingCount;
}

function updateCurrentDisplay(counterNumber) {
  const current = queue.currentTicket;
  if (!current) {
    currentTicketEl.textContent = "—";
    currentCounterEl.textContent = "—";
    operatorCurrentTicketEl.textContent = "—";
    operatorCurrentServiceEl.textContent = "—";
    btnRecall.disabled = true;
    btnFinish.disabled = true;
    return;
  }

  currentTicketEl.textContent = current.label;
  currentCounterEl.textContent = counterNumber ?? "—";
  operatorCurrentTicketEl.textContent = current.label;
  operatorCurrentServiceEl.textContent = current.service;

  btnRecall.disabled = false;
  btnFinish.disabled = false;
}

function renderRecentCalls() {
  recentCallsEl.innerHTML = "";
  queue.recentCalls.forEach((call) => {
    const li = document.createElement("li");
    li.textContent = `${call.label} – ${call.service}`;
    recentCallsEl.appendChild(li);
  });
}

// 4) 이벤트 등록

// 서비스 선택 → 티켓 발급
serviceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const service = btn.dataset.service;
    const ticket = queue.issueTicket(service);

    ticketOutputEl.innerHTML = `
      <p>Your ticket number is <strong>${ticket.label}</strong> (${ticket.service}).</p>
      <p>Please wait until your number is called.</p>
    `;

    updateWaitingCount();
  });
});

// 다음 손님 호출
btnNext.addEventListener("click", () => {
  const counterNumber = counterSelectEl.value;
  const next = queue.callNext();

  if (!next) {
    // 호출할 사람이 없음
    ticketOutputEl.innerHTML = `<p>No more waiting customers.</p>`;
    updateCurrentDisplay(null);
    renderRecentCalls();
    return;
  }

  updateWaitingCount();
  updateCurrentDisplay(counterNumber);
  renderRecentCalls();
});

// 현재 손님 재호출
btnRecall.addEventListener("click", () => {
  const counterNumber = counterSelectEl.value;
  const current = queue.recallCurrent();
  if (!current) return;

  updateCurrentDisplay(counterNumber);
  // 실제로는 "딩동!" 알람 같은 걸 줄 수 있지만
  // 여기서는 화면 갱신만.
});

// 현재 손님 처리 완료
btnFinish.addEventListener("click", () => {
  queue.finishCurrent();
  updateCurrentDisplay(null);
});

// 초기 UI 상태 세팅
updateWaitingCount();
updateCurrentDisplay(null);
renderRecentCalls();
