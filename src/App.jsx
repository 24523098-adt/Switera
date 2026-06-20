import { useEffect, useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard";
import InputData from "./pages/InputData";
import ManajemenData from "./pages/ManajemenData";
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
      content = <Register onNavigate={navigateTo} />;
    } else if (route === "/login") {
      content = <Login onNavigate={navigateTo} />;
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
