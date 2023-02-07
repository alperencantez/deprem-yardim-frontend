import { ClusterPopup } from "@/components/UI/ClusterPopup/ClusterPopup";
import Drawer from "@/components/UI/Drawer/Drawer";
import FooterBanner from "@/components/UI/FooterBanner/FooterBanner";
import {
  LocationsResponse,
  MarkerData,
  CoordinatesURLParameters,
} from "@/mocks/types";
import { useMapActions, useCoordinates } from "@/stores/mapStore";
import styles from "@/styles/Home.module.css";
import Container from "@mui/material/Container";
import dynamic from "next/dynamic";
import Head from "next/head";

import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Partytown } from "@builder.io/partytown/react";
import dataTransformer from "@/utils/dataTransformer";
import useDebounce from "@/hooks/useDebounce";
import { HelpButton } from "@/components/UI/Button/HelpButton";

const LeafletMap = dynamic(() => import("@/components/UI/Map"), {
  ssr: false,
});

const baseURL = "https://api.afetharita.com/tweets/locations";

export default function Home() {
  const [results, setResults] = useState<MarkerData[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  const [url, setURL] = useState(baseURL);
  const debouncedURL = useDebounce(url, 1000);

  const { toggleDrawer, setDrawerData, setPopUpData } = useMapActions();
  const coordinates: CoordinatesURLParameters | undefined = useCoordinates();

  useEffect(() => {
    if (coordinates) {
      const urlParams = new URLSearchParams(coordinates as any);
      setURL(baseURL + "?" + urlParams.toString());
    }
  }, [coordinates]);

  useEffect(() => {
    if (debouncedURL) {
      fetch(debouncedURL)
        .then((res) => res.json())
        .then((res) => {
          setResults(dataTransformer(res));
          setLoaded(true);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [debouncedURL]);

  const handleMarkerClick = useCallback(
    () => (event: KeyboardEvent | MouseEvent, markerData?: MarkerData) => {
      if (
        event.type === "keydown" &&
        ((event as KeyboardEvent).key === "Tab" ||
          (event as KeyboardEvent).key === "Shift")
      )
        return;

      toggleDrawer();

      if (markerData) {
        setDrawerData(markerData);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const togglePopUp = useCallback(
    (e: any) => {
      e.cluster.zoomToBounds({ padding: [20, 20] });

      setPopUpData({
        count: e.markers.length ?? 0,
        baseMarker: e.markers[0].options.markerData,
        markers: e.markers,
      });
    },
    [setPopUpData]
  );

  return (
    <>
      <Head>
        <Partytown debug={true} forward={["dataLayer.push"]} />
        <title>Afet Haritası | Anasayfa</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <HelpButton />
        <Container maxWidth={false} disableGutters>
          {loaded && (
            <LeafletMap
              // @ts-expect-error
              onClickMarker={handleMarkerClick()}
              data={results}
              onClusterClick={togglePopUp}
            />
          )}
        </Container>
        <Drawer toggler={handleMarkerClick()} />
        <ClusterPopup />
        <FooterBanner />
      </main>
    </>
  );
}
