<template>
  <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center mb-8">
        Méthodologie utilisée pour l’évaluation des tronçons
      </h2>
      <p class="text-xl text-gray-500 text-center mb-12">
        Axes magistraux, structurants et autres aménagements complétant les Grandes Voies Vélo
      </p>

      <div class="prose prose-lg text-gray-500 mx-auto">
        <p class="mb-8">
          Pour garantir une analyse homogène et transparente, nous avons appliqué les principes suivants :
        </p>

        <div class="space-y-10">
          <!-- Section 1 -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 flex items-center mb-4">
              <span class="mr-2">✅</span>
              Critères de satisfaction d'un réseau cyclable
            </h3>
            <p class="mb-2">
              Selon la
              <a
                href="https://www.fub.fr/sites/fub/files/fub_note-position_rev_241017_web.pdf"
                target="_blank"
                class="text-lvv-blue-600 hover:underline"
                >FUB</a
              >. Un tronçon est considéré comme satisfaisant uniquement s’il correspond à :
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Une piste cyclable (mono ou bidirectionnelle)</li>
              <li>Une voie verte avec une très faible présence piétonne</li>
              <li>Une vélorue sans trafic de transit</li>
            </ul>
            <p class="mt-2 text-sm italic">
              Tous les autres aménagements (bandes cyclables, trottoirs partagés, zones mixtes avec flux motorisés) sont
              jugés non satisfaisants pour un réseau cyclable à haut niveau de service.
            </p>
          </div>

          <!-- Section 2 -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 flex items-center mb-4">
              <span class="mr-2">✅</span>
              Cycloscore
            </h3>
            <p class="mb-2">
              Notation simplifiée du youtubeur
              <a href="https://altisplay.fr/cyclo-score/" target="_blank" class="text-lvv-blue-600 hover:underline"
                >AltisPlay</a
              >. Le Cycloscore permet de distinguer rapidement un bon aménagement d’un mauvais :
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Bande cyclable → mauvaise note (D ou E)</li>
              <li>Piste cyclable conforme (largeur adaptée, continuité, priorité) → meilleure note (A ou B)</li>
              <li>Piste trop étroite ou en cohabitation avec piétons → note dégradée (D)</li>
            </ul>
            <p class="mt-2">
              <a
                href="https://altisplay.fr/wp-content/uploads/2025/11/image.jpg"
                target="_blank"
                class="text-lvv-blue-600 hover:underline flex items-center"
              >
                Voir le diagramme de décision
                <Icon name="heroicons:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
              </a>
            </p>
          </div>

          <!-- Section 3 -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 flex items-center mb-4">
              <span class="mr-2">✅</span>
              Principe d’évaluation
            </h3>
            <p>
              Pour chaque tronçon, nous avons retenu le côté le moins favorable de la voirie en cas d’infrastructure
              asymétrique. Cela reflète la réalité vécue par les cyclistes et évite de surévaluer la qualité globale.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
