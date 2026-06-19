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
import store from "./store";
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

function App() {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [route, setRoute] = useState(getRoute());
  const [activePage, setActivePage] = useState(
    pageByPath[getRoute()] ?? getDefaultMenuByRole(store.getRoleAktif())
  );

  const navigateTo = (nextRoute) => {
    if (window.location.pathname !== nextRoute) {
      window.history.pushState({}, "", nextRoute);
    }
    setRoute(nextRoute);
  };

  const navigatePage = (page) => {
    setActivePage(page);
    navigateTo(pathByPage[page] ?? "/dashboard");
  };

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = snapshot.tema;
  }, [snapshot.tema]);

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
        navigateTo("/login");
      }
      return;
    }

    if (!allowedPages.includes(activePage)) {
      const defaultPage = getDefaultMenuByRole(snapshot.roleAktif);
      navigatePage(defaultPage);
    }
  }, [activePage, allowedPages, route, snapshot.roleAktif, snapshot.userAktif]);

  useEffect(() => {
    if (snapshot.userAktif) {
      const pageFromRoute = pageByPath[route];
      const defaultPage = getDefaultMenuByRole(snapshot.userAktif.role);
      const nextPage = pageFromRoute ?? defaultPage;
      setActivePage(nextPage);

      if (route === "/login" || route === "/register" || route === "/") {
        navigateTo(pathByPage[defaultPage] ?? "/dashboard");
      }
    }
  }, [route, snapshot.userAktif?.role]);

  if (!snapshot.userAktif) {
    if (route === "/register") {
      return <Register onNavigate={navigateTo} />;
    }

    if (route === "/login") {
      return <Login onNavigate={navigateTo} />;
    }

    return <Landing onNavigate={navigateTo} />;
  }

  const ActivePage = pageRegistry[activePage] ?? Dashboard;

  return <ActivePage onNavigate={navigatePage} />;
}

export default App;
