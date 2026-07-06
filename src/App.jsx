import { useEffect, useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard";
import InputData from "./pages/InputData";
import ManajemenData from "./pages/ManajemenData";
import ManajemenKota from "./pages/ManajemenKota";
import ManajemenAkun from "./pages/ManajemenAkun";
import AnalisisRanking from "./pages/AnalisisRanking";
import KeputusanDistribusi from "./pages/KeputusanDistribusi";
import StatusDistribusi from "./pages/StatusDistribusi";
import Laporan from "./pages/Laporan";
import RiwayatAktivitas from "./pages/RiwayatAktivitas";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import store from "./store";
import useToast from "./components/Toast";
import { getDefaultMenuByRole, menuByRole } from "./utils/navigation";

const pageRegistry = {
  dashboard: Dashboard,
  "input-data": InputData,
  "manajemen-data": ManajemenData,
  "manajemen-kota": ManajemenKota,
  "manajemen-akun": ManajemenAkun,
  "analisis-ranking": AnalisisRanking,
  "keputusan-distribusi": KeputusanDistribusi,
  "status-distribusi": StatusDistribusi,
  laporan: Laporan,
  "riwayat-aktivitas": RiwayatAktivitas,
};

const pathByPage = {
  dashboard: "/dashboard",
  "input-data": "/input-data",
  "manajemen-data": "/manajemen-data",
  "manajemen-kota": "/manajemen-kota",
  "manajemen-akun": "/manajemen-akun",
  "analisis-ranking": "/analisis-ranking",
  "keputusan-distribusi": "/keputusan-distribusi",
  "status-distribusi": "/status-distribusi",
  laporan: "/laporan",
  "riwayat-aktivitas": "/riwayat-aktivitas",
};

const pageByPath = Object.fromEntries(
  Object.entries(pathByPage).map(([page, path]) => [path, page])
);

const getRoute = () => window.location.pathname || "/login";

const withViewTransition = (callback) => {
  if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
    const transition = document.startViewTransition(callback);
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
  } else {
    callback();
  }
};

function App() {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [route, setRoute] = useState(getRoute());
  const [activePage, setActivePage] = useState(
    pageByPath[getRoute()] ?? getDefaultMenuByRole(store.getRoleAktif())
  );

  const pushRoute = (nextRoute) => {
    if (window.location.pathname !== nextRoute) {
      window.history.pushState({}, "", nextRoute);
    }
    setRoute(nextRoute);
  };

  const navigateTo = (nextRoute) => {
    withViewTransition(() => pushRoute(nextRoute));
  };

  const navigatePage = (page) => {
    withViewTransition(() => {
      setActivePage(page);
      pushRoute(pathByPage[page] ?? "/dashboard");
    });
  };

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  // Single global bootstrap (FE-01/09-05) + SYNC-01 polling lifecycle: on
  // the userAktif transition — either a fresh login OR a session restored
  // from localStorage on app-init — pull every domain collection from the
  // server immediately (store.hydrate()) so the whole app renders with no
  // manual refresh, THEN start the SYNC-01 poll interval (store.startPolling())
  // so every collection keeps refreshing automatically afterward. Per-page
  // mount loaders added in 09-02..09-04 remain as a harmless, idempotent
  // belt-and-suspenders refresh. Depending on userAktif?.username (not the
  // whole object) keeps this from re-firing on every snapshot update. The
  // effect's cleanup calls store.stopPolling() — React runs it whenever
  // username changes OR becomes undefined, which is exactly logout and a
  // 401 (both clear userAktif), so polling stops the moment there is no
  // valid session, with no separate logout-button handler or 401 callback
  // edit needed.
  useEffect(() => {
    if (snapshot.userAktif?.username) {
      store.hydrate();
      store.startPolling();
    }

    return () => {
      store.stopPolling();
    };
  }, [snapshot.userAktif?.username]);

  useEffect(() => {
    const isMarketingOrAuth = route === "/" || !snapshot.userAktif;
    document.documentElement.dataset.theme = isMarketingOrAuth ? "dark" : snapshot.tema;
  }, [snapshot.tema, snapshot.userAktif, route]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoute());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const allowedPages = useMemo(
    () => menuByRole[snapshot.roleAktif]?.map((item) => item.key) ?? ["dashboard"],
    [snapshot.roleAktif]
  );

  useEffect(() => {
    if (!snapshot.userAktif) {
      if (route !== "/login" && route !== "/register" && route !== "/") {
        navigateTo("/");
      }
      return;
    }

    if (!allowedPages.includes(activePage)) {
      const defaultPage = getDefaultMenuByRole(snapshot.roleAktif);
      navigatePage(defaultPage);
    }
  }, [activePage, allowedPages, route, snapshot.roleAktif, snapshot.userAktif]);

  useEffect(() => {
    if (snapshot.userAktif && route !== "/") {
      const pageFromRoute = pageByPath[route];
      const defaultPage = getDefaultMenuByRole(snapshot.userAktif.role);
      const nextPage = pageFromRoute ?? defaultPage;
      setActivePage(nextPage);

      if (route === "/login" || route === "/register") {
        navigateTo(pathByPage[defaultPage] ?? "/dashboard");
      }
    }
  }, [route, snapshot.userAktif?.role]);

  const { ToastContainer } = useToast();

  let content;

  if (route === "/") {
    content = <Landing onNavigate={navigateTo} />;
  } else if (!snapshot.userAktif) {
    if (route === "/register") {
      content = <Register onNavigate={navigateTo} onClose={() => navigateTo("/")} />;
    } else if (route === "/login") {
      content = <Login onNavigate={navigateTo} onClose={() => navigateTo("/")} />;
    } else {
      content = <Landing onNavigate={navigateTo} />;
    }
  } else {
    const ActivePage = pageRegistry[activePage] ?? Dashboard;
    content = (
      <Layout menuAktif={activePage} onMenuChange={navigatePage}>
        <ActivePage onNavigate={navigatePage} />
      </Layout>
    );
  }

  return (
    <>
      {content}
      <ToastContainer />
    </>
  );
}

export default App;
